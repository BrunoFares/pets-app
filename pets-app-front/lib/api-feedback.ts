import { ApiRequestError } from "@/lib/api";
import {
  getDefaultSoftErrorNoticeMessage,
  showSoftErrorNotice,
} from "@/lib/soft-error-notice";
import { Alert } from "react-native";

export function isNetworkApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError && error.status === 0;
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export function presentApiError(
  title: string,
  error: unknown,
  options?: {
    fallbackMessage?: string;
    networkMessage?: string;
  },
) {
  if (isNetworkApiRequestError(error)) {
    showSoftErrorNotice(
      options?.networkMessage ?? getDefaultSoftErrorNoticeMessage(),
    );
    return;
  }

  Alert.alert(
    title,
    getApiErrorMessage(error, options?.fallbackMessage ?? "Please try again."),
  );
}
