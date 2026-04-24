import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChatMessageModel, ChatSessionModel } from "@/data/models";

const LOCAL_CHATS_STORAGE_KEY = "local_chat_sessions";

type ChatMessageInput = {
  role: "User" | "Bot";
  content: string;
};

function createLocalId(prefix: string) {
  return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function toTimestamp() {
  return new Date().toISOString();
}

function mapChatMessageInputToModel(message: ChatMessageInput): ChatMessageModel {
  return {
    Id: createLocalId("chat_message_"),
    Role: message.role,
    Content: message.content,
    CreatedAt: toTimestamp(),
  };
}

function normalizeStoredChatMessage(message: unknown): ChatMessageModel | null {
  if (!message || typeof message !== "object") {
    return null;
  }

  const rawMessage = message as Partial<ChatMessageModel>;
  if (
    typeof rawMessage.Id !== "string" ||
    (rawMessage.Role !== "User" && rawMessage.Role !== "Bot") ||
    typeof rawMessage.Content !== "string" ||
    (typeof rawMessage.CreatedAt !== "string" &&
      typeof rawMessage.CreatedAt !== "number")
  ) {
    return null;
  }

  return {
    Id: rawMessage.Id,
    Role: rawMessage.Role,
    Content: rawMessage.Content,
    CreatedAt: rawMessage.CreatedAt,
  };
}

function normalizeStoredChat(chat: unknown): ChatSessionModel | null {
  if (!chat || typeof chat !== "object") {
    return null;
  }

  const rawChat = chat as Partial<ChatSessionModel>;
  const discussion = Array.isArray(rawChat.Discussion)
    ? rawChat.Discussion
        .map(normalizeStoredChatMessage)
        .filter((item): item is ChatMessageModel => item !== null)
    : [];

  if (
    typeof rawChat.Id !== "string" ||
    (typeof rawChat.UserId !== "string" && typeof rawChat.UserId !== "number") ||
    (typeof rawChat.CreatedAt !== "string" &&
      typeof rawChat.CreatedAt !== "number")
  ) {
    return null;
  }

  return {
    Id: rawChat.Id,
    UserId: rawChat.UserId,
    Discussion: discussion,
    CreatedAt: rawChat.CreatedAt,
    UpdatedAt:
      typeof rawChat.UpdatedAt === "string" ||
      typeof rawChat.UpdatedAt === "number"
        ? rawChat.UpdatedAt
        : null,
  };
}

async function readStoredChats() {
  const storedValue = await AsyncStorage.getItem(LOCAL_CHATS_STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue) as unknown[];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map(normalizeStoredChat)
      .filter((chat): chat is ChatSessionModel => chat !== null);
  } catch (error) {
    console.error("[chat-api] Failed to parse stored chats", error);
    await AsyncStorage.removeItem(LOCAL_CHATS_STORAGE_KEY);
    return [];
  }
}

async function writeStoredChats(chats: ChatSessionModel[]) {
  await AsyncStorage.setItem(LOCAL_CHATS_STORAGE_KEY, JSON.stringify(chats));
}

export async function fetchChats() {
  return readStoredChats();
}

export async function fetchChatById(id: string) {
  const chats = await readStoredChats();
  const chat = chats.find((item) => item.Id === id);

  if (!chat) {
    throw new Error("Chat not found.");
  }

  return chat;
}

export async function createChat(messages: ChatMessageInput[]) {
  const chats = await readStoredChats();
  const createdAt = toTimestamp();
  const chatId = createLocalId("chat_");

  const nextChat: ChatSessionModel = {
    Id: chatId,
    UserId: "local",
    Discussion: messages.map(mapChatMessageInputToModel),
    CreatedAt: createdAt,
    UpdatedAt: createdAt,
  };

  await writeStoredChats([nextChat, ...chats]);
  return nextChat.Id;
}

export async function appendChatMessages(
  id: string,
  messages: ChatMessageInput[],
) {
  const chats = await readStoredChats();
  const chatIndex = chats.findIndex((chat) => chat.Id === id);

  if (chatIndex < 0) {
    throw new Error("Chat not found.");
  }

  const updatedChat: ChatSessionModel = {
    ...chats[chatIndex],
    Discussion: [
      ...chats[chatIndex].Discussion,
      ...messages.map(mapChatMessageInputToModel),
    ],
    UpdatedAt: toTimestamp(),
  };

  const nextChats = [...chats];
  nextChats[chatIndex] = updatedChat;

  await writeStoredChats(nextChats);
}

export function getChatSessionTitle(chat?: ChatSessionModel | null) {
  const firstUserMessage = chat?.Discussion.find((item) => item.Role === "User");
  const fallbackMessage = chat?.Discussion[0];
  const rawTitle = firstUserMessage?.Content || fallbackMessage?.Content || "New chat";
  return rawTitle.length > 40 ? `${rawTitle.slice(0, 40).trim()}...` : rawTitle;
}

export function getChatSessionPreview(chat?: ChatSessionModel | null) {
  const latestMessage = chat?.Discussion.at(-1);
  if (!latestMessage) {
    return "Start a conversation with Dr. Pet.";
  }

  return latestMessage.Content.length > 70
    ? `${latestMessage.Content.slice(0, 70).trim()}...`
    : latestMessage.Content;
}
