import { MedicationRecordModel } from "@/data/models";
import { getMedicationDueDate, startOfDay } from "@/utils";

const DAY_MS = 1000 * 60 * 60 * 24;
const DEFAULT_LOOKAHEAD_DAYS = 30;
const MIN_FUTURE_OFFSET_MS = 5000;

export const DEFAULT_MEDICATION_REMINDER_TIMES = ["09:00"] as const;

export function isValidMedicationReminderTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export function normalizeMedicationReminderTimes(times?: string[] | null) {
  const cleanedTimes = (times ?? [])
    .map((time) => time.trim())
    .filter(isValidMedicationReminderTime);

  return cleanedTimes.length
    ? cleanedTimes
    : [...DEFAULT_MEDICATION_REMINDER_TIMES];
}

export function normalizeMedicationReminderRecord(
  medication: MedicationRecordModel,
): MedicationRecordModel {
  return {
    ...medication,
    times: normalizeMedicationReminderTimes(medication.times),
    reminderEnabled: medication.isActive ? true : medication.reminderEnabled,
  };
}

function parseMedicationReminderTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return { hour, minute };
}

export function getMedicationReminderDates(
  medication: MedicationRecordModel,
  options?: {
    daysAhead?: number;
    from?: Date;
  },
) {
  const normalizedMedication = normalizeMedicationReminderRecord(medication);
  const now = options?.from ?? new Date();
  const horizonDays = options?.daysAhead ?? DEFAULT_LOOKAHEAD_DAYS;
  const firstDueDay = getMedicationDueDate(normalizedMedication, now);

  if (!firstDueDay) {
    return [];
  }

  const frequencyInDays = Math.max(normalizedMedication.frequencyInDays, 1);
  const horizonEnd = startOfDay(
    new Date(now.getTime() + horizonDays * DAY_MS),
  );
  const endDate = normalizedMedication.endDate
    ? startOfDay(new Date(normalizedMedication.endDate))
    : null;
  const reminderDates: Date[] = [];
  let dueDay = startOfDay(firstDueDay);

  while (
    dueDay.getTime() <= horizonEnd.getTime() &&
    (!endDate || dueDay.getTime() <= endDate.getTime())
  ) {
    normalizeMedicationReminderTimes(normalizedMedication.times).forEach(
      (time) => {
        const { hour, minute } = parseMedicationReminderTime(time);
        const reminderDate = new Date(dueDay);
        reminderDate.setHours(hour, minute, 0, 0);

        if (reminderDate.getTime() > now.getTime() + MIN_FUTURE_OFFSET_MS) {
          reminderDates.push(reminderDate);
        }
      },
    );

    dueDay = new Date(dueDay);
    dueDay.setDate(dueDay.getDate() + frequencyInDays);
  }

  return reminderDates;
}
