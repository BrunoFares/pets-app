import * as ImagePicker from "expo-image-picker";
import {
  DirectMessageConversationModel,
  DirectMessageConversationSummaryModel,
  DirectMessageModel,
  DirectMessageUserModel,
} from "@/data/models";
import { apiRequest, resolveApiUrl } from "@/lib/api";

type ApiDirectMessageUserResponse = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string | null;
  isApprovedPlaceOwner: boolean;
};

type ApiDirectMessageResponse = {
  id: number;
  conversationId: number;
  senderUserId: number;
  content: string;
  mediaUrl?: string | null;
  mediaType?: "Image" | "Video" | null;
  mediaSizeBytes?: number | null;
  createdAt: string;
};

type ApiConversationSummaryResponse = {
  id: number;
  otherParticipant: ApiDirectMessageUserResponse;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  createdAt: string;
};

type ApiConversationDetailResponse = {
  id: number;
  otherParticipant: ApiDirectMessageUserResponse;
  createdAt: string;
  lastMessageAt?: string | null;
  lastReadAt?: string | null;
  messages: ApiDirectMessageResponse[];
};

type ApiMarkConversationReadResponse = {
  conversationId: number;
  lastReadAt: string;
};

const VIDEO_EXTENSIONS = [
  ".mp4",
  ".mov",
  ".m4v",
  ".webm",
  ".3gp",
  ".3gpp",
];

export type SendDirectMessageInput = {
  content?: string;
  mediaAsset?: ImagePicker.ImagePickerAsset | null;
};

export function isDirectMessageVideoAsset(
  asset: Pick<ImagePicker.ImagePickerAsset, "mimeType" | "type" | "fileName">,
) {
  const normalizedMimeType = asset.mimeType?.toLowerCase() ?? "";
  const normalizedAssetType =
    typeof asset.type === "string" ? asset.type.toLowerCase() : "";
  const normalizedFileName = asset.fileName?.trim().toLowerCase() ?? "";

  return (
    normalizedMimeType.startsWith("video/") ||
    normalizedAssetType === "video" ||
    VIDEO_EXTENSIONS.some((extension) =>
      normalizedFileName.endsWith(extension),
    )
  );
}

function buildDirectMessageFormData(
  content: string,
  mediaAsset: ImagePicker.ImagePickerAsset,
) {
  const formData = new FormData();
  const normalizedContent = content.trim();
  const normalizedMimeType = mediaAsset.mimeType?.toLowerCase() ?? "";
  const isVideo = isDirectMessageVideoAsset(mediaAsset);

  if (normalizedContent) {
    formData.append("content", normalizedContent);
  }

  if (isVideo) {
    const extensionFromMimeType =
      normalizedMimeType === "video/quicktime"
        ? "mov"
        : normalizedMimeType === "video/webm"
          ? "webm"
          : normalizedMimeType === "video/3gpp"
            ? "3gpp"
            : "mp4";
    const extensionFromFileName =
      mediaAsset.fileName?.split(".").pop()?.toLowerCase() ?? "";
    const extension = extensionFromFileName || extensionFromMimeType || "mp4";
    const mimeType =
      normalizedMimeType ||
      (extension === "mov"
        ? "video/quicktime"
        : extension === "webm"
          ? "video/webm"
          : extension === "3gp" || extension === "3gpp"
            ? "video/3gpp"
            : "video/mp4");
    const name =
      mediaAsset.fileName?.trim() || `dm-video.${extension}`;

    formData.append("file", {
      uri: mediaAsset.uri,
      name,
      type: mimeType,
    } as any);
    return formData;
  }

  const extensionFromMimeType =
    normalizedMimeType === "image/png"
      ? "png"
      : normalizedMimeType === "image/webp"
        ? "webp"
        : "jpg";
  const extensionFromFileName =
    mediaAsset.fileName?.split(".").pop()?.toLowerCase() ?? "";
  const extension =
    extensionFromFileName === "png" || extensionFromFileName === "webp"
      ? extensionFromFileName
      : extensionFromFileName === "jpg" || extensionFromFileName === "jpeg"
        ? "jpg"
        : extensionFromMimeType;
  const mimeType =
    extension === "png"
      ? "image/png"
      : extension === "webp"
        ? "image/webp"
        : "image/jpeg";
  const name = mediaAsset.fileName?.trim() || `dm-photo.${extension}`;

  formData.append("file", {
    uri: mediaAsset.uri,
    name,
    type: mimeType,
  } as any);

  return formData;
}

function mapParticipantToModel(
  participant: ApiDirectMessageUserResponse,
): DirectMessageUserModel {
  return {
    Id: participant.id,
    Username: participant.username,
    FirstName: participant.firstName,
    LastName: participant.lastName,
    DisplayName: participant.displayName,
    AvatarUrl: resolveApiUrl(participant.avatarUrl ?? null),
    IsApprovedPlaceOwner: participant.isApprovedPlaceOwner,
  };
}

function mapMessageToModel(
  message: ApiDirectMessageResponse,
): DirectMessageModel {
  return {
    Id: message.id,
    ConversationId: message.conversationId,
    SenderUserId: message.senderUserId,
    Content: message.content,
    MediaUrl: resolveApiUrl(message.mediaUrl ?? null),
    MediaType: message.mediaType ?? null,
    MediaSizeBytes: message.mediaSizeBytes ?? null,
    CreatedAt: message.createdAt,
  };
}

function mapConversationSummaryToModel(
  conversation: ApiConversationSummaryResponse,
): DirectMessageConversationSummaryModel {
  return {
    Id: conversation.id,
    OtherParticipant: mapParticipantToModel(conversation.otherParticipant),
    LastMessagePreview: conversation.lastMessagePreview ?? null,
    LastMessageAt: conversation.lastMessageAt ?? null,
    UnreadCount: conversation.unreadCount,
    CreatedAt: conversation.createdAt,
  };
}

function mapConversationDetailToModel(
  conversation: ApiConversationDetailResponse,
): DirectMessageConversationModel {
  return {
    Id: conversation.id,
    OtherParticipant: mapParticipantToModel(conversation.otherParticipant),
    CreatedAt: conversation.createdAt,
    LastMessageAt: conversation.lastMessageAt ?? null,
    LastReadAt: conversation.lastReadAt ?? null,
    Messages: conversation.messages.map(mapMessageToModel),
  };
}

export async function fetchConversations() {
  const response = await apiRequest<ApiConversationSummaryResponse[]>(
    "/api/messages/conversations",
  );

  return response.map(mapConversationSummaryToModel);
}

export async function fetchConversationById(id: string | number) {
  const response = await apiRequest<ApiConversationDetailResponse>(
    `/api/messages/conversations/${encodeURIComponent(String(id))}`,
  );

  return mapConversationDetailToModel(response);
}

export async function createConversation(otherUserId: string | number) {
  const response = await apiRequest<ApiConversationSummaryResponse>(
    `/api/messages/conversations/${encodeURIComponent(String(otherUserId))}`,
    {
      method: "POST",
    },
  );

  return mapConversationSummaryToModel(response);
}

export async function sendDirectMessage(
  conversationId: string | number,
  input: string | SendDirectMessageInput,
) {
  const normalizedInput =
    typeof input === "string" ? { content: input } : input;
  const normalizedContent = normalizedInput.content?.trim() ?? "";
  const requestBody = normalizedInput.mediaAsset
    ? buildDirectMessageFormData(normalizedContent, normalizedInput.mediaAsset)
    : JSON.stringify({ content: normalizedContent });

  const response = await apiRequest<ApiDirectMessageResponse>(
    `/api/messages/conversations/${encodeURIComponent(String(conversationId))}/messages`,
    {
      method: "POST",
      body: requestBody,
    },
  );

  return mapMessageToModel(response);
}

export async function markConversationRead(conversationId: string | number) {
  const response = await apiRequest<ApiMarkConversationReadResponse>(
    `/api/messages/conversations/${encodeURIComponent(String(conversationId))}/read`,
    {
      method: "POST",
    },
  );

  return response;
}

export function getConversationParticipantName(
  participant?: DirectMessageUserModel | null,
) {
  if (!participant) {
    return "Direct Messages";
  }

  return participant.DisplayName?.trim() || `@${participant.Username}`;
}

export function getConversationPreviewLabel(
  conversation?: Pick<
    DirectMessageConversationSummaryModel,
    "LastMessagePreview"
  > | null,
) {
  if (conversation?.LastMessagePreview?.trim()) {
    if (conversation?.LastMessagePreview?.trim().length < 27)
      return conversation.LastMessagePreview;
    else return conversation.LastMessagePreview?.trim().slice(0, 27) + "...";
  }

  return "Sent an attachment";
}
