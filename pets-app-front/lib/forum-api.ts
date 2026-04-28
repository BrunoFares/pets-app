import * as ImagePicker from "expo-image-picker";
import {
  ForumPostAttachmentModel,
  ForumPostsModel,
} from "@/data/models";
import {
  apiRequest,
  resolveApiUrl,
  resolveApiUrlWithCacheBust,
} from "@/lib/api";

export const MAX_FORUM_ATTACHMENTS = 4;

export type ApiForumPostAttachmentResponse = {
  id?: number | string;
  Id?: number | string;
  url?: string | null;
  Url?: string | null;
  mediaType?: string | null;
  MediaType?: string | null;
  fileSizeBytes?: number | null;
  FileSizeBytes?: number | null;
  createdAt?: string | null;
  CreatedAt?: string | null;
};

export type ApiForumPostResponse = {
  id?: string;
  Id?: string;
  userId?: string | number;
  UserId?: string | number;
  userName?: string;
  UserName?: string;
  userImage?: string | null;
  UserImage?: string | null;
  content?: string;
  Content?: string;
  attachments?: (ApiForumPostAttachmentResponse | string)[] | null;
  Attachments?: (ApiForumPostAttachmentResponse | string)[] | null;
  createdAt?: string | number;
  CreatedAt?: string | number;
  updatedAt?: string | number | null;
  UpdatedAt?: string | number | null;
  isAReply?: boolean;
  IsAReply?: boolean;
  replyingToPost?: string | null;
  ReplyingToPost?: string | null;
  repliesCount?: number;
  RepliesCount?: number;
  isBookmarked?: boolean;
  IsBookmarked?: boolean;
  isBookmarkedByCurrentUser?: boolean;
  IsBookmarkedByCurrentUser?: boolean;
  likesCount?: number;
  LikesCount?: number;
  isLikedByCurrentUser?: boolean;
  IsLikedByCurrentUser?: boolean;
};

type CreateForumPostResponse = {
  id?: string;
  Id?: string;
};

const VIDEO_EXTENSIONS = [
  ".mp4",
  ".mov",
  ".m4v",
  ".webm",
  ".3gp",
  ".3gpp",
];

function isVideoAsset(asset: ImagePicker.ImagePickerAsset) {
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

function inferAttachmentMediaType(
  url: string,
): ForumPostAttachmentModel["MediaType"] {
  const normalizedUrl = url.split("?")[0].toLowerCase();

  return VIDEO_EXTENSIONS.some((extension) =>
    normalizedUrl.endsWith(extension),
  )
    ? "Video"
    : "Image";
}

function normalizeAttachmentMediaType(
  mediaType: unknown,
  url: string,
): ForumPostAttachmentModel["MediaType"] {
  if (typeof mediaType === "string") {
    const normalized = mediaType.trim().toLowerCase();

    if (normalized === "video") {
      return "Video";
    }

    if (normalized === "image") {
      return "Image";
    }
  }

  return inferAttachmentMediaType(url);
}

function normalizeForumPostAttachment(
  attachment: ApiForumPostAttachmentResponse | string,
): ForumPostAttachmentModel | null {
  if (typeof attachment === "string") {
    const resolvedUrl = resolveApiUrl(attachment);

    if (!resolvedUrl) {
      return null;
    }

    return {
      Id: attachment,
      Url: resolvedUrl,
      MediaType: inferAttachmentMediaType(attachment),
      FileSizeBytes: 0,
      CreatedAt: "",
    };
  }

  const rawUrl = attachment.url ?? attachment.Url ?? "";
  const resolvedUrl = resolveApiUrl(rawUrl);

  if (!resolvedUrl) {
    return null;
  }

  return {
    Id: attachment.id ?? attachment.Id ?? rawUrl,
    Url: resolvedUrl,
    MediaType: normalizeAttachmentMediaType(
      attachment.mediaType ?? attachment.MediaType,
      rawUrl,
    ),
    FileSizeBytes:
      attachment.fileSizeBytes ?? attachment.FileSizeBytes ?? 0,
    CreatedAt: attachment.createdAt ?? attachment.CreatedAt ?? "",
  };
}

export function normalizeForumPost(
  post: ApiForumPostResponse,
  avatarCacheKey?: string | number,
): ForumPostsModel {
  const rawAttachments = post.attachments ?? post.Attachments ?? [];

  return {
    Id: String(post.id ?? post.Id ?? ""),
    UserId: post.userId ?? post.UserId ?? "",
    UserName: post.userName ?? post.UserName ?? "",
    UserImage: resolveApiUrlWithCacheBust(
      post.userImage ?? post.UserImage ?? null,
      avatarCacheKey,
    ),
    Content: post.content ?? post.Content ?? "",
    Attachments: rawAttachments
      .map(normalizeForumPostAttachment)
      .filter(
        (attachment): attachment is ForumPostAttachmentModel =>
          attachment !== null,
      ),
    CreatedAt: post.createdAt ?? post.CreatedAt ?? "",
    UpdatedAt: post.updatedAt ?? post.UpdatedAt ?? null,
    IsAReply: post.isAReply ?? post.IsAReply ?? false,
    ReplyingToPost: post.replyingToPost ?? post.ReplyingToPost ?? null,
    RepliesCount: post.repliesCount ?? post.RepliesCount ?? 0,
    IsBookmarked:
      post.isBookmarked ??
      post.IsBookmarked ??
      post.isBookmarkedByCurrentUser ??
      post.IsBookmarkedByCurrentUser ??
      false,
    LikesCount: post.likesCount ?? post.LikesCount ?? 0,
    IsLikedByCurrentUser:
      post.isLikedByCurrentUser ?? post.IsLikedByCurrentUser ?? false,
  };
}

function buildForumAttachmentsFormData(
  assets: ImagePicker.ImagePickerAsset[],
) {
  const formData = new FormData();

  for (const [index, asset] of assets.entries()) {
    const normalizedMimeType = asset.mimeType?.toLowerCase() ?? "";
    const isVideo = isVideoAsset(asset);

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
        asset.fileName?.split(".").pop()?.toLowerCase() ?? "";
      const extension =
        extensionFromFileName || extensionFromMimeType || "mp4";
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
        asset.fileName?.trim() || `forum-video-${index + 1}.${extension}`;
      formData.append("files", { uri: asset.uri, name, type: mimeType } as any);
    } else {
      const extensionFromMimeType =
        normalizedMimeType === "image/png"
          ? "png"
          : normalizedMimeType === "image/webp"
            ? "webp"
            : "jpg";
      const extensionFromFileName =
        asset.fileName?.split(".").pop()?.toLowerCase() ?? "";
      const extension =
        extensionFromFileName === "png" || extensionFromFileName === "webp"
          ? extensionFromFileName
          : extensionFromFileName === "jpg" || extensionFromFileName === "jpeg"
            ? "jpg"
            : extensionFromMimeType;
      const type =
        extension === "png"
          ? "image/png"
          : extension === "webp"
            ? "image/webp"
            : "image/jpeg";
      const name =
        asset.fileName?.trim() || `forum-attachment-${index + 1}.${extension}`;

      formData.append("files", {
        uri: asset.uri,
        name,
        type,
      } as any);
    }
  }

  return formData;
}

export async function createForumPost(content: string) {
  return apiRequest<CreateForumPostResponse>("/api/ForumPosts", {
    method: "POST",
    body: JSON.stringify({
      content: content.trim(),
      attachments: [],
    }),
  });
}

export function getForumPostIdFromCreateResponse(
  response: CreateForumPostResponse | null | undefined,
) {
  const postId = response?.id ?? response?.Id;
  return postId ? String(postId) : null;
}

export async function uploadForumPostAttachments(
  postId: string,
  assets: ImagePicker.ImagePickerAsset[],
) {
  if (assets.length === 0) {
    return [];
  }

  return apiRequest<ApiForumPostAttachmentResponse[]>(
    `/api/ForumPosts/${postId}/attachments`,
    {
      method: "POST",
      body: buildForumAttachmentsFormData(assets),
    },
  );
}
