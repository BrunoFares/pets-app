import { ChatMessageModel, ChatSessionModel } from "@/data/models";
import { apiRequest } from "@/lib/api";

type ApiChatMessageResponse = {
  id: number;
  role: "User" | "Bot";
  content: string;
  createdAt: string;
};

type ApiChatResponse = {
  id: string;
  userId: number;
  discussion: ApiChatMessageResponse[];
  createdAt: string;
  updatedAt?: string | null;
};

type ChatMessageInput = {
  role: "User" | "Bot";
  content: string;
};

function mapApiChatMessageToModel(
  message: ApiChatMessageResponse,
): ChatMessageModel {
  return {
    Id: String(message.id),
    Role: message.role,
    Content: message.content,
    CreatedAt: message.createdAt,
  };
}

function mapApiChatToModel(chat: ApiChatResponse): ChatSessionModel {
  return {
    Id: chat.id,
    UserId: chat.userId,
    Discussion: (chat.discussion ?? []).map(mapApiChatMessageToModel),
    CreatedAt: chat.createdAt,
    UpdatedAt: chat.updatedAt ?? null,
  };
}

export async function fetchChats() {
  const response = await apiRequest<ApiChatResponse[]>("/api/Chats");
  return response.map(mapApiChatToModel);
}

export async function fetchChatById(id: string) {
  const response = await apiRequest<ApiChatResponse>(`/api/Chats/${id}`);
  return mapApiChatToModel(response);
}

export async function createChat(messages: ChatMessageInput[]) {
  const response = await apiRequest<{ id: string }>("/api/Chats", {
    method: "POST",
    body: JSON.stringify({
      discussion: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    }),
  });

  return response.id;
}

export async function appendChatMessages(
  id: string,
  messages: ChatMessageInput[],
) {
  await apiRequest(`/api/Chats/${id}/append`, {
    method: "PUT",
    body: JSON.stringify({
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    }),
  });
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
