export type SoftErrorNotice = {
  id: number;
  message: string;
};

const DEFAULT_NETWORK_NOTICE_MESSAGE =
  "We couldn't reach the server. Please check your connection and try again.";
const NOTICE_DURATION_MS = 4800;
const DEDUPE_WINDOW_MS = 1800;

let activeNotice: SoftErrorNotice | null = null;
let lastNoticeMessage = "";
let lastNoticeAt = 0;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

const listeners = new Set<(notice: SoftErrorNotice | null) => void>();

function emitNotice() {
  for (const listener of listeners) {
    listener(activeNotice);
  }
}

export function dismissSoftErrorNotice() {
  activeNotice = null;

  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }

  emitNotice();
}

export function showSoftErrorNotice(
  message = DEFAULT_NETWORK_NOTICE_MESSAGE,
) {
  const now = Date.now();

  if (
    activeNotice &&
    lastNoticeMessage === message &&
    now - lastNoticeAt < DEDUPE_WINDOW_MS
  ) {
    return;
  }

  lastNoticeMessage = message;
  lastNoticeAt = now;
  activeNotice = {
    id: now,
    message,
  };

  if (dismissTimer) {
    clearTimeout(dismissTimer);
  }

  dismissTimer = setTimeout(() => {
    dismissSoftErrorNotice();
  }, NOTICE_DURATION_MS);

  emitNotice();
}

export function subscribeToSoftErrorNotice(
  listener: (notice: SoftErrorNotice | null) => void,
) {
  listeners.add(listener);
  listener(activeNotice);

  return () => {
    listeners.delete(listener);
  };
}

export function getDefaultSoftErrorNoticeMessage() {
  return DEFAULT_NETWORK_NOTICE_MESSAGE;
}
