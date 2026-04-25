import { colors } from "@/constants/colors";
import { PlaceModel, PlaceScheduleModel } from "@/data/models";
import React, { useMemo } from "react";
import { StyleSheet, View, useColorScheme } from "react-native";
import { AdaptiveText } from "./AdaptiveText";

const DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

type DayName = (typeof DAY_OPTIONS)[number];

function normalizeDayOfWeek(value: string | number): DayName | null {
  if (typeof value === "number" && value >= 0 && value < DAY_OPTIONS.length) {
    return DAY_OPTIONS[value];
  }

  const match = DAY_OPTIONS.find((day) => day === value);
  return match ?? null;
}

function getDayLabel(day: DayName) {
  if (day === "Thursday") return "Thursday";
  if (day === "Saturday") return "Saturday";
  if (day === "Tuesday") return "Tuesday";
  if (day === "Wednesday") return "Wednesday";
  if (day === "Monday") return "Monday";
  if (day === "Friday") return "Friday";
  return "Sunday";
}

function buildPrimaryHours(entry: PlaceScheduleModel) {
  if (entry.IsClosed) {
    return "Closed";
  }

  if (!entry.OpenTime || !entry.CloseTime) {
    return "Hours unavailable";
  }

  return `${entry.OpenTime} - ${entry.CloseTime}`;
}

function buildBreakHours(entry: PlaceScheduleModel) {
  if (!entry.BreakStartTime || !entry.BreakEndTime) {
    return null;
  }

  return `Break ${entry.BreakStartTime} - ${entry.BreakEndTime}`;
}

function sortScheduleEntries(schedule: PlaceScheduleModel[]) {
  const byDay = new Map<DayName, PlaceScheduleModel>();

  for (const entry of schedule) {
    const day = normalizeDayOfWeek(entry.DayOfWeek);
    if (!day || byDay.has(day)) {
      continue;
    }

    byDay.set(day, entry);
  }

  return DAY_OPTIONS.map((day) => {
    const entry = byDay.get(day);
    if (!entry) {
      return null;
    }

    return {
      day,
      entry,
    };
  }).filter((value): value is { day: DayName; entry: PlaceScheduleModel } =>
    Boolean(value),
  );
}

export function PlaceScheduleSection({
  place,
  emptyMessage = "A weekly schedule has not been added for this place yet.",
}: {
  place: Pick<PlaceModel, "Schedule">;
  emptyMessage?: string;
}) {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const scheduleRows = useMemo(
    () => sortScheduleEntries(place.Schedule ?? []),
    [place.Schedule],
  );

  return (
    <View style={styles.section}>
      <AdaptiveText style={styles.sectionTitle}>Weekly Schedule</AdaptiveText>
      <AdaptiveText style={styles.sectionSubtitle}>
        Hours are shown using 24-hour time.
      </AdaptiveText>

      {scheduleRows.length > 0 ? (
        <View style={styles.scheduleList}>
          {scheduleRows.map(({ day, entry }) => {
            const breakHours = buildBreakHours(entry);

            return (
              <View key={day} style={styles.scheduleRow}>
                <AdaptiveText style={styles.dayLabel}>
                  {getDayLabel(day)}
                </AdaptiveText>

                <View style={styles.hoursWrap}>
                  <AdaptiveText
                    style={[
                      styles.hoursValue,
                      entry.IsClosed ? styles.closedValue : null,
                    ]}
                  >
                    {buildPrimaryHours(entry)}
                  </AdaptiveText>

                  {breakHours ? (
                    <AdaptiveText style={styles.breakValue}>
                      {breakHours}
                    </AdaptiveText>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <AdaptiveText style={styles.emptyValue}>{emptyMessage}</AdaptiveText>
      )}
    </View>
  );
}

const createStyles = ({ darkMode }: { darkMode: boolean }) =>
  StyleSheet.create({
    section: {
      marginHorizontal: 16,
      marginTop: 18,
      padding: 18,
      borderRadius: 20,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    sectionTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 18,
    },
    sectionSubtitle: {
      marginTop: 6,
      marginBottom: 14,
      fontFamily: "Poppins-Regular",
      lineHeight: 22,
      opacity: 0.78,
    },
    scheduleList: {
      gap: 10,
    },
    scheduleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: darkMode ? colors.mildDarkGrey : colors.lightGreen,
    },
    dayLabel: {
      flex: 0.95,
      fontFamily: "Poppins-Medium",
      fontSize: 14,
    },
    hoursWrap: {
      flex: 1.25,
      alignItems: "flex-end",
      gap: 3,
    },
    hoursValue: {
      textAlign: "right",
      fontFamily: "Poppins-SemiBold",
      fontSize: 14,
    },
    closedValue: {
      color: darkMode ? colors.lightOrange : colors.red,
    },
    breakValue: {
      textAlign: "right",
      fontSize: 12,
      opacity: 0.74,
    },
    emptyValue: {
      fontFamily: "Poppins-Regular",
      lineHeight: 22,
      opacity: 0.82,
    },
  });
