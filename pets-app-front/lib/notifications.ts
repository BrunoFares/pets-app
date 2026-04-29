import Constants from "expo-constants";
import { fetchMedicationReminders } from "@/lib/profile-api";
import { getMedicationReminderDates } from "@/lib/medication-reminders";
import { Platform } from "react-native";

type NotificationsModule = typeof import("expo-notifications");

export type NotificationPermissionState = {
  granted: boolean;
  status: string;
};

type NotificationSubscription = {
  remove: () => void;
};

const MEDICATION_REMINDER_PREFIX = "medication-reminder:";
const NOTIFICATIONS_UNAVAILABLE_MESSAGE =
  "Notifications are unavailable in Expo Go on Android. Use a development build to test notification features.";

let notificationsModule: NotificationsModule | null | undefined;
let notificationRegistrationPromise: Promise<string | null> | null = null;
let unavailableWarningLogged = false;

function logNotificationsUnavailable(error: unknown) {
  if (unavailableWarningLogged) {
    return;
  }

  unavailableWarningLogged = true;
  console.warn("[notifications] Notification features disabled.", {
    reason: NOTIFICATIONS_UNAVAILABLE_MESSAGE,
    error,
  });
}

function getNotificationsModule() {
  if (notificationsModule !== undefined) {
    return notificationsModule;
  }

  try {
    notificationsModule = require("expo-notifications") as NotificationsModule;
  } catch (error) {
    notificationsModule = null;
    logNotificationsUnavailable(error);
  }

  return notificationsModule;
}

function createMedicationReminderIdentifier(
  medicationId: string | number,
  reminderDate: Date,
) {
  return `${MEDICATION_REMINDER_PREFIX}${medicationId}:${reminderDate.toISOString()}`;
}

function isMedicationReminderIdentifier(identifier: string) {
  return identifier.startsWith(MEDICATION_REMINDER_PREFIX);
}

export function getNotificationsUnavailableMessage() {
  return NOTIFICATIONS_UNAVAILABLE_MESSAGE;
}

export function configureNotificationHandler() {
  const Notifications = getNotificationsModule();

  if (!Notifications) {
    return false;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  return true;
}

export function addNotificationReceivedListener(
  listener: (notification: unknown) => void,
): NotificationSubscription | null {
  const Notifications = getNotificationsModule();
  return Notifications
    ? Notifications.addNotificationReceivedListener(listener as never)
    : null;
}

export function addNotificationResponseReceivedListener(
  listener: (response: unknown) => void,
): NotificationSubscription | null {
  const Notifications = getNotificationsModule();
  return Notifications
    ? Notifications.addNotificationResponseReceivedListener(listener as never)
    : null;
}

export async function getNotificationPermissionAsync() {
  const Notifications = getNotificationsModule();

  if (!Notifications) {
    return null;
  }

  const permission = await Notifications.getPermissionsAsync();
  return {
    granted: permission.granted,
    status: String(permission.status),
  } satisfies NotificationPermissionState;
}

export async function requestNotificationPermissionAsync() {
  const Notifications = getNotificationsModule();

  if (!Notifications) {
    return null;
  }

  const permission = await Notifications.requestPermissionsAsync();
  return {
    granted: permission.granted,
    status: String(permission.status),
  } satisfies NotificationPermissionState;
}

export async function clearMedicationReminderNotifications() {
  const Notifications = getNotificationsModule();

  if (!Notifications) {
    return;
  }

  const scheduledNotifications =
    await Notifications.getAllScheduledNotificationsAsync();
  const medicationReminderIds = scheduledNotifications
    .filter((request) => {
      const kind = request.content.data?.kind;
      return (
        isMedicationReminderIdentifier(request.identifier) ||
        kind === "medication-reminder"
      );
    })
    .map((request) => request.identifier);

  await Promise.all(
    medicationReminderIds.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier),
    ),
  );
}

async function scheduleMedicationReminderNotification(
  medicationName: string,
  medicationId: string | number,
  dosage: string | undefined,
  reminderDate: Date,
) {
  const Notifications = getNotificationsModule();

  if (!Notifications) {
    return;
  }

  const body = dosage?.trim()
    ? `Time to give ${medicationName} (${dosage.trim()}).`
    : `Time to give ${medicationName}.`;

  await Notifications.scheduleNotificationAsync({
    identifier: createMedicationReminderIdentifier(medicationId, reminderDate),
    content: {
      title: "Medication reminder",
      body,
      sound: "default",
      data: {
        kind: "medication-reminder",
        medicationId: String(medicationId),
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
      channelId: "default",
    },
  });
}

export async function syncMedicationReminderNotifications() {
  const Notifications = getNotificationsModule();

  if (!Notifications) {
    return;
  }

  try {
    const permission = await Notifications.getPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const medications = await fetchMedicationReminders();
    await clearMedicationReminderNotifications();

    const now = new Date();

    for (const medication of medications) {
      const reminderDates = getMedicationReminderDates(medication, { from: now });

      for (const reminderDate of reminderDates) {
        await scheduleMedicationReminderNotification(
          medication.medicationName,
          medication.Id,
          medication.dosage,
          reminderDate,
        );
      }
    }
  } catch (error) {
    console.error("[notifications] Failed to sync medication reminders", error);
  }
}

export async function registerForPushNotificationsAsync() {
  const Notifications = getNotificationsModule();

  if (!Notifications) {
    return null;
  }

  if (notificationRegistrationPromise) {
    return notificationRegistrationPromise;
  }

  notificationRegistrationPromise = (async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permission not granted");
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.log("Project ID not found");
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return token;
  })();

  try {
    return await notificationRegistrationPromise;
  } finally {
    notificationRegistrationPromise = null;
  }
}
