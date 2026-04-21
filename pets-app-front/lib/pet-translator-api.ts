import { apiRequest } from "@/lib/api";

export type PetTranslatorLabel = "cat" | "dog" | "neither";

export type PetTranslatorAnalysis = {
  label: PetTranslatorLabel;
  confidence: number;
  probabilities: Record<PetTranslatorLabel, number>;
  translationAvailable: boolean;
  message: string;
};

type RecordedAudioUpload = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

function buildAudioFormData(audio: RecordedAudioUpload) {
  const formData = new FormData();
  const normalizedMimeType = audio.mimeType?.toLowerCase() ?? "";
  const extensionFromMimeType =
    normalizedMimeType === "audio/webm"
      ? "webm"
      : normalizedMimeType === "audio/mpeg"
        ? "mp3"
        : normalizedMimeType === "audio/wav" ||
            normalizedMimeType === "audio/x-wav"
          ? "wav"
          : "m4a";
  const extensionFromFileName =
    audio.fileName?.split(".").pop()?.toLowerCase() ?? "";
  const extension =
    extensionFromFileName === "webm" ||
    extensionFromFileName === "wav" ||
    extensionFromFileName === "mp3" ||
    extensionFromFileName === "m4a"
      ? extensionFromFileName
      : extensionFromMimeType;
  const type =
    extension === "webm"
      ? "audio/webm"
      : extension === "wav"
        ? "audio/wav"
        : extension === "mp3"
          ? "audio/mpeg"
          : "audio/mp4";
  const name = audio.fileName?.trim() || `pet-recording.${extension}`;

  formData.append("file", {
    uri: audio.uri,
    name,
    type,
  } as any);

  return formData;
}

export async function analyzePetAudio(audio: RecordedAudioUpload) {
  return apiRequest<PetTranslatorAnalysis>("/api/PetTranslator/analyze", {
    method: "POST",
    body: buildAudioFormData(audio),
  });
}
