import { Router } from "expo-router";
import {
  ConsultationModel,
  IllnessRecordModel,
  MedicationRecordModel,
  PetModel,
  VaccineRecordModel,
} from "./data/models";

export type ReminderType = "medication" | "vaccination" | "consultation";
export type ReminderUrgency = "overdue" | "today" | "upcoming";

export type ReminderBoardItem = {
  key: string;
  type: ReminderType;
  urgency: ReminderUrgency;
  pet: PetModel;
  title: string;
  subtitle: string;
  dueDate: Date;
};

const DAY_MS = 1000 * 60 * 60 * 24;

export function goTo(item: any, location: any, router: Router) {
  const payload = encodeURIComponent(JSON.stringify(item));
  const routeId =
    item?.key ??
    item?.Id ??
    item?.id ??
    item?.pet?.Id ??
    item?.pet?.id ??
    item?.item?.Id ??
    item?.item?.id ??
    "";

  router.push({
    pathname: location,
    params: { id: String(routeId), payload },
  });
}

export function calculateAge(birthdate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();

  // If the current month is before the birth month, subtract one year
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthdate.getDate())
  ) {
    age--;
  }
  return age;
}

export function getRandomIntegerInclusive(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function datediff(first: number, second: number) {
  return Math.round((second - first) / (1000 * 60 * 60 * 24));
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function differenceInDays(target: Date, base: Date) {
  return Math.round(
    (startOfDay(target).getTime() - startOfDay(base).getTime()) / DAY_MS,
  );
}

export function getUrgency(daysUntil: number): ReminderUrgency {
  if (daysUntil < 0) return "overdue";
  if (daysUntil === 0) return "today";
  return "upcoming";
}

export function formatReminderDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getRelativeDueLabel(date: Date) {
  const daysUntil = differenceInDays(date, new Date());

  if (daysUntil < 0) {
    return `${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? "" : "s"} overdue`;
  }

  if (daysUntil === 0) return "Due today";
  if (daysUntil === 1) return "Due tomorrow";
  return `Due in ${daysUntil} days`;
}

export function getMedicationDueDate(
  medication: MedicationRecordModel,
  today: Date,
) {
  const start = startOfDay(new Date(medication.startDate));
  const end = medication.endDate
    ? startOfDay(new Date(medication.endDate))
    : null;
  const now = startOfDay(today);

  if (end && end.getTime() < now.getTime()) {
    return null;
  }

  if (start.getTime() >= now.getTime()) {
    return start;
  }

  const every = Math.max(medication.frequencyInDays, 1);
  const daysSinceStart = differenceInDays(now, start);
  const cyclesElapsed = Math.floor(daysSinceStart / every);
  const nextDue = new Date(start);
  nextDue.setDate(start.getDate() + cyclesElapsed * every);

  if (differenceInDays(nextDue, now) < 0) {
    nextDue.setDate(nextDue.getDate() + every);
  }

  if (end && nextDue.getTime() > end.getTime()) {
    return null;
  }

  return nextDue;
}

export function getReminderTypeLabel(type: ReminderType) {
  if (type === "medication") return "Medication";
  if (type === "vaccination") return "Vaccination";
  return "Consultation";
}

type BuildReminderBoardItemsArgs = {
  consultations: ConsultationModel[];
  illnessRecords: IllnessRecordModel[];
  medicationRecords: MedicationRecordModel[];
  pets: PetModel[];
  today?: Date;
  vaccineRecords: VaccineRecordModel[];
};

export function buildReminderBoardItems({
  consultations,
  illnessRecords,
  medicationRecords,
  pets,
  today = new Date(),
  vaccineRecords,
}: BuildReminderBoardItemsArgs): ReminderBoardItem[] {
  return pets
    .flatMap<ReminderBoardItem>((pet) => {
      const petIllnesses = illnessRecords.filter(
        (illness) => illness.petId === pet.Id,
      );
      const petVaccines = vaccineRecords.filter(
        (record) => record.petId === pet.Id,
      );
      const petConsultations = consultations.filter(
        (consultation) => consultation.PetId === pet.Id,
      );

      const medicationReminders: ReminderBoardItem[] = [];

      petIllnesses.forEach((illness) => {
        illness.medicationsId.forEach((medicationId) => {
          const record = medicationRecords.find(
            (medication) => medication.Id === medicationId,
          );

          if (!record?.reminderEnabled || !record.isActive) {
            return;
          }

          const dueDate = getMedicationDueDate(record, today);

          if (!dueDate) {
            return;
          }

          medicationReminders.push({
            key: `med-${record.Id}`,
            type: "medication",
            urgency: getUrgency(differenceInDays(dueDate, today)),
            pet,
            title: record.medicationName,
            subtitle: illness.illnessName,
            dueDate,
          });
        });
      });

      const vaccinationReminders: ReminderBoardItem[] = petVaccines
        .filter((record) => record.nextDueDate)
        .map((record) => {
          const dueDate = new Date(record.nextDueDate!);

          return {
            key: `vax-${record.Id}`,
            type: "vaccination",
            urgency: getUrgency(differenceInDays(dueDate, today)),
            pet,
            title: record.vaccineName,
            subtitle:
              record.status === "Done" ? "Booster reminder" : "Vaccination due",
            dueDate,
          };
        });

      const consultationReminders: ReminderBoardItem[] = petConsultations.length
        ? (() => {
            const latestConsultation = [...petConsultations].sort(
              (a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime(),
            )[0];
            const dueDate = new Date(latestConsultation.Date);
            dueDate.setMonth(dueDate.getMonth() + 6);

            return [
              {
                key: `consult-${pet.Id}`,
                type: "consultation",
                urgency: getUrgency(differenceInDays(dueDate, today)),
                pet,
                title: "Routine check-in",
                subtitle: `Last visit ${formatReminderDate(
                  new Date(latestConsultation.Date),
                )}`,
                dueDate,
              },
            ];
          })()
        : [];

      return [
        ...medicationReminders,
        ...vaccinationReminders,
        ...consultationReminders,
      ];
    })
    .sort((a, b) => {
      const urgencyOrder = { overdue: 0, today: 1, upcoming: 2 };
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];

      if (urgencyDiff !== 0) return urgencyDiff;

      return a.dueDate.getTime() - b.dueDate.getTime();
    });
}
