import Constants from "expo-constants";
// import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { fetchMedicationReminders } from "@/lib/profile-api";
import { getMedicationReminderDates } from "@/lib/medication-reminders";
import { Platform } from "react-native";

const MEDICATION_REMINDER_PREFIX = "medication-reminder:";
let notificationRegistrationPromise: Promise<string | null> | null = null;

function createMedicationReminderIdentifier(
  medicationId: string | number,
  reminderDate: Date,
) {
  return `${MEDICATION_REMINDER_PREFIX}${medicationId}:${reminderDate.toISOString()}`;
}

function isMedicationReminderIdentifier(identifier: string) {
  return identifier.startsWith(MEDICATION_REMINDER_PREFIX);
}

export async function clearMedicationReminderNotifications() {
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

    //   if (!Device.isDevice) {
    //     console.log("Must use a real device for push notifications");
    //     return null;
    //   }

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
