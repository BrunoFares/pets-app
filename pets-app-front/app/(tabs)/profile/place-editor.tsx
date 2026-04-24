import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthProvider";
import { useGlobal } from "@/contexts/GlobalProvider";
import { PlaceModel } from "@/data/models";
import { presentApiError } from "@/lib/api-feedback";
import { fetchPlaceById } from "@/lib/discovery-api";
import {
  createManagedPlace,
  deleteManagedPlace,
  ManagedPlaceInput,
  updateManagedPlace,
} from "@/lib/place-owner-api";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAY_OPTIONS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

type DayName = (typeof DAY_OPTIONS)[number];

type EditableScheduleEntry = {
  dayOfWeek: DayName;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
  breakStartTime: string;
  breakEndTime: string;
};

const PLACE_TYPE_OPTIONS: PlaceModel["Type"][] = ["Vet", "PetShop", "Other"];
const PLACE_STATUS_OPTIONS: PlaceModel["Status"][] = [
  "Active",
  "Inactive",
  "Closed",
];

function getDefaultSchedule(): EditableScheduleEntry[] {
  return DAY_OPTIONS.map((day) => {
    const isWeekend = day === "Sunday" || day === "Saturday";

    return {
      dayOfWeek: day,
      isClosed: isWeekend,
      openTime: isWeekend ? "" : "09:00",
      closeTime: isWeekend ? "" : "17:00",
      breakStartTime: "",
      breakEndTime: "",
    };
  });
}

function normalizeDayOfWeek(value: string | number): DayName {
  if (typeof value === "number" && value >= 0 && value < DAY_OPTIONS.length) {
    return DAY_OPTIONS[value];
  }

  const match = DAY_OPTIONS.find((day) => day === value);
  return match ?? "Monday";
}

function mapPlaceToEditableSchedule(place: PlaceModel) {
  const defaultsByDay = new Map(
    getDefaultSchedule().map((entry) => [entry.dayOfWeek, entry]),
  );
  const byDay = new Map(
    place.Schedule.map((entry) => [
      normalizeDayOfWeek(entry.DayOfWeek),
      {
        dayOfWeek: normalizeDayOfWeek(entry.DayOfWeek),
        isClosed: entry.IsClosed,
        openTime: entry.OpenTime ?? "",
        closeTime: entry.CloseTime ?? "",
        breakStartTime: entry.BreakStartTime ?? "",
        breakEndTime: entry.BreakEndTime ?? "",
      },
    ]),
  );

  return DAY_OPTIONS.map((day) => byDay.get(day) ?? defaultsByDay.get(day)!);
}

function parseTimeToMinutes(value: string) {
  const trimmed = value.trim();
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(trimmed);
  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function validateSchedule(schedule: EditableScheduleEntry[]) {
  for (const entry of schedule) {
    if (entry.isClosed) {
      continue;
    }

    if (!entry.openTime.trim() || !entry.closeTime.trim()) {
      return `${entry.dayOfWeek}: opening and closing times are required.`;
    }

    const openMinutes = parseTimeToMinutes(entry.openTime);
    const closeMinutes = parseTimeToMinutes(entry.closeTime);
    if (openMinutes === null || closeMinutes === null) {
      return `${entry.dayOfWeek}: use HH:MM time values like 09:00.`;
    }

    if (openMinutes >= closeMinutes) {
      return `${entry.dayOfWeek}: opening time must be earlier than closing time.`;
    }

    const hasBreakStart = Boolean(entry.breakStartTime.trim());
    const hasBreakEnd = Boolean(entry.breakEndTime.trim());

    if (hasBreakStart !== hasBreakEnd) {
      return `${entry.dayOfWeek}: break start and end must be filled together.`;
    }

    if (!hasBreakStart) {
      continue;
    }

    const breakStartMinutes = parseTimeToMinutes(entry.breakStartTime);
    const breakEndMinutes = parseTimeToMinutes(entry.breakEndTime);

    if (breakStartMinutes === null || breakEndMinutes === null) {
      return `${entry.dayOfWeek}: break times must use HH:MM format.`;
    }

    if (breakStartMinutes >= breakEndMinutes) {
      return `${entry.dayOfWeek}: break start must be earlier than break end.`;
    }

    if (
      breakStartMinutes <= openMinutes ||
      breakEndMinutes >= closeMinutes
    ) {
      return `${entry.dayOfWeek}: break times must fall inside the opening hours.`;
    }
  }

  return null;
}

function dayLabel(day: DayName) {
  if (day === "Thursday") return "Thu";
  if (day === "Saturday") return "Sat";
  if (day === "Tuesday") return "Tue";
  if (day === "Wednesday") return "Wed";
  if (day === "Monday") return "Mon";
  if (day === "Friday") return "Fri";
  return "Sun";
}

export default function PlaceEditorScreen() {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { setShowFooter } = useGlobal();
  const isEditing = Boolean(id);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState("");
  const [description, setDescription] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [placeType, setPlaceType] = useState<PlaceModel["Type"]>("Vet");
  const [placeStatus, setPlaceStatus] =
    useState<PlaceModel["Status"]>("Active");
  const [schedule, setSchedule] = useState<EditableScheduleEntry[]>(
    getDefaultSchedule(),
  );
  const [place, setPlace] = useState<PlaceModel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnerActive = Boolean(user?.IsApprovedPlaceOwner);

  const applyPlaceToForm = useCallback((nextPlace: PlaceModel) => {
    setPlace(nextPlace);
    setName(nextPlace.Name);
    setPhone(nextPlace.Phone);
    setEmail(nextPlace.Email);
    setPhoto(nextPlace.Photo ?? "");
    setDescription(nextPlace.Description ?? "");
    setAddressLine1(nextPlace.AddressLine1);
    setAddressLine2(nextPlace.AddressLine2 ?? "");
    setCity(nextPlace.City);
    setCountry(nextPlace.Country);
    setLatitude(
      nextPlace.Latitude === null || nextPlace.Latitude === undefined
        ? ""
        : String(nextPlace.Latitude),
    );
    setLongitude(
      nextPlace.Longitude === null || nextPlace.Longitude === undefined
        ? ""
        : String(nextPlace.Longitude),
    );
    setPlaceType(nextPlace.Type);
    setPlaceStatus(nextPlace.Status);
    setSchedule(mapPlaceToEditableSchedule(nextPlace));
  }, []);

  const loadPlace = useCallback(async () => {
    if (!id) {
      setPlace(null);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetchPlaceById(id);

      if (user && String(response.OwnerUserId ?? "") !== String(user.Id)) {
        setPlace(null);
        setErrorMessage("You can only edit places that belong to your account.");
        return;
      }

      setErrorMessage(null);
      applyPlaceToForm(response);
    } catch (error) {
      setPlace(null);
      setErrorMessage("We couldn't load this place right now.");
      presentApiError("Could not load place", error);
    } finally {
      setIsLoading(false);
    }
  }, [applyPlaceToForm, id, user]);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);
      void loadPlace();

      return () => {
        setShowFooter?.(true);
      };
    }, [loadPlace, setShowFooter]),
  );

  const updateScheduleEntry = useCallback(
    (day: DayName, changes: Partial<EditableScheduleEntry>) => {
      setSchedule((current) =>
        current.map((entry) => {
          if (entry.dayOfWeek !== day) {
            return entry;
          }

          const nextEntry = {
            ...entry,
            ...changes,
          };

          if (changes.isClosed) {
            return {
              ...nextEntry,
              openTime: "",
              closeTime: "",
              breakStartTime: "",
              breakEndTime: "",
            };
          }

          return nextEntry;
        }),
      );
    },
    [],
  );

  const schedulePayload = useMemo<ManagedPlaceInput["schedule"]>(
    () =>
      schedule.map((entry) => ({
        dayOfWeek: entry.dayOfWeek,
        isClosed: entry.isClosed,
        openTime: entry.openTime.trim() || null,
        closeTime: entry.closeTime.trim() || null,
        breakStartTime: entry.breakStartTime.trim() || null,
        breakEndTime: entry.breakEndTime.trim() || null,
      })),
    [schedule],
  );

  const handleSave = async () => {
    if (!isOwnerActive) {
      Alert.alert(
        "Access unavailable",
        "Your place-owner approval is not active right now.",
      );
      return;
    }

    if (
      !name.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !addressLine1.trim() ||
      !city.trim() ||
      !country.trim()
    ) {
      Alert.alert(
        "Missing information",
        "Please complete the required place details before saving.",
      );
      return;
    }

    const scheduleError = validateSchedule(schedule);
    if (scheduleError) {
      Alert.alert("Check schedule", scheduleError);
      return;
    }

    const parsedLatitude = latitude.trim() ? Number(latitude.trim()) : null;
    const parsedLongitude = longitude.trim() ? Number(longitude.trim()) : null;

    if (
      (latitude.trim() && !Number.isFinite(parsedLatitude)) ||
      (longitude.trim() && !Number.isFinite(parsedLongitude))
    ) {
      Alert.alert(
        "Invalid coordinates",
        "Latitude and longitude must be valid numbers.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: ManagedPlaceInput = {
        name,
        phone,
        email,
        photo,
        description,
        addressLine1,
        addressLine2,
        city,
        country,
        status: placeStatus,
        type: placeType,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        schedule: schedulePayload,
      };

      if (id) {
        await updateManagedPlace(id, payload);
      } else {
        await createManagedPlace(payload);
      }

      router.back();
    } catch (error) {
      presentApiError("Could not save place", error, {
        fallbackMessage:
          "We couldn't save your place details right now.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = useCallback(() => {
    if (!id) {
      return;
    }

    Alert.alert(
      "Delete this place?",
      "This will remove the place from the directory.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                setIsDeleting(true);
                await deleteManagedPlace(id);
                router.replace("/profile/place-manager");
              } catch (error) {
                presentApiError("Could not delete place", error, {
                  fallbackMessage:
                    "We couldn't delete this place right now.",
                });
              } finally {
                setIsDeleting(false);
              }
            })();
          },
        },
      ],
    );
  }, [id, router]);

  const showLoadingOverlay = isSubmitting || isDeleting;

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="Place Editor" />
        <ProfileEmptyState
          title="Sign in required"
          subtitle="Log in to manage your place listings."
          style={styles.emptyStateCard}
        />
      </SafeAreaView>
    );
  }

  if (!isOwnerActive) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="Place Editor" />
        <ProfileEmptyState
          title="Owner approval inactive"
          subtitle="Your place-owner approval is not active right now, so editing is unavailable."
          style={styles.emptyStateCard}
        />
      </SafeAreaView>
    );
  }

  if (errorMessage && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title={isEditing ? "Edit Place" : "Add Place"} />
        <ProfileEmptyState
          title="Place unavailable"
          subtitle={errorMessage}
          style={styles.emptyStateCard}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title={isEditing ? "Edit Place" : "Add Place"} />

      <ScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        contentContainerStyle={styles.content}
      >
        <View style={styles.heroCard}>
          <AdaptiveText style={styles.title}>
            {isEditing ? "Update your listing" : "Create a new listing"}
          </AdaptiveText>
          <AdaptiveText style={styles.subtitle}>
            Keep the public details, visibility status, and weekly schedule in
            sync with how your place actually operates.
          </AdaptiveText>
        </View>

        <AdaptiveText style={styles.sectionLabel}>Place Type</AdaptiveText>
        <View style={styles.optionRow}>
          {PLACE_TYPE_OPTIONS.map((option) => {
            const isSelected = placeType === option;

            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionChip,
                  isSelected ? styles.optionChipSelected : null,
                ]}
                onPress={() => setPlaceType(option)}
                activeOpacity={0.85}
              >
                <AdaptiveText
                  style={[
                    styles.optionChipText,
                    isSelected ? styles.optionChipTextSelected : null,
                  ]}
                >
                  {option === "PetShop" ? "Pet Shop" : option}
                </AdaptiveText>
              </TouchableOpacity>
            );
          })}
        </View>

        <AdaptiveText style={styles.sectionLabel}>Listing Status</AdaptiveText>
        <View style={styles.optionRow}>
          {PLACE_STATUS_OPTIONS.map((option) => {
            const isSelected = placeStatus === option;

            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionChip,
                  isSelected ? styles.optionChipSelected : null,
                ]}
                onPress={() => setPlaceStatus(option)}
                activeOpacity={0.85}
              >
                <AdaptiveText
                  style={[
                    styles.optionChipText,
                    isSelected ? styles.optionChipTextSelected : null,
                  ]}
                >
                  {option}
                </AdaptiveText>
              </TouchableOpacity>
            );
          })}
        </View>

        <AdaptiveText style={styles.sectionLabel}>Place Name</AdaptiveText>
        <CustomInput value={name} onChangeText={setName} />

        <AdaptiveText style={styles.sectionLabel}>Phone</AdaptiveText>
        <CustomInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <AdaptiveText style={styles.sectionLabel}>Email</AdaptiveText>
        <CustomInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <AdaptiveText style={styles.sectionLabel}>Photo URL</AdaptiveText>
        <CustomInput
          value={photo}
          onChangeText={setPhoto}
          autoCapitalize="none"
          keyboardType="url"
        />

        <AdaptiveText style={styles.sectionLabel}>Description</AdaptiveText>
        <CustomInput
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
          style={styles.descriptionInput}
        />

        <AdaptiveText style={styles.sectionLabel}>Address Line 1</AdaptiveText>
        <CustomInput value={addressLine1} onChangeText={setAddressLine1} />

        <AdaptiveText style={styles.sectionLabel}>Address Line 2</AdaptiveText>
        <CustomInput value={addressLine2} onChangeText={setAddressLine2} />

        <AdaptiveText style={styles.sectionLabel}>City</AdaptiveText>
        <CustomInput value={city} onChangeText={setCity} />

        <AdaptiveText style={styles.sectionLabel}>Country</AdaptiveText>
        <CustomInput value={country} onChangeText={setCountry} />

        <AdaptiveText style={styles.sectionLabel}>Latitude</AdaptiveText>
        <CustomInput
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="decimal-pad"
        />

        <AdaptiveText style={styles.sectionLabel}>Longitude</AdaptiveText>
        <CustomInput
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="decimal-pad"
        />

        <View style={styles.scheduleSection}>
          <AdaptiveText style={styles.scheduleTitle}>Weekly Schedule</AdaptiveText>
          <AdaptiveText style={styles.scheduleSubtitle}>
            Use 24-hour time like 09:00 and leave break times blank if you do
            not close mid-day.
          </AdaptiveText>

          {schedule.map((entry) => (
            <View key={entry.dayOfWeek} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <AdaptiveText style={styles.dayTitle}>
                  {dayLabel(entry.dayOfWeek)}
                </AdaptiveText>

                <TouchableOpacity
                  style={[
                    styles.closedToggle,
                    entry.isClosed ? styles.closedToggleSelected : null,
                  ]}
                  onPress={() =>
                    updateScheduleEntry(entry.dayOfWeek, {
                      isClosed: !entry.isClosed,
                    })
                  }
                  activeOpacity={0.85}
                >
                  <AdaptiveText
                    style={[
                      styles.closedToggleText,
                      entry.isClosed ? styles.closedToggleTextSelected : null,
                    ]}
                  >
                    {entry.isClosed ? "Closed" : "Open"}
                  </AdaptiveText>
                </TouchableOpacity>
              </View>

              {!entry.isClosed ? (
                <>
                  <View style={styles.timeRow}>
                    <CustomInput
                      value={entry.openTime}
                      onChangeText={(value) =>
                        updateScheduleEntry(entry.dayOfWeek, {
                          openTime: value,
                        })
                      }
                      placeholder="09:00"
                      style={styles.timeField}
                    />
                    <CustomInput
                      value={entry.closeTime}
                      onChangeText={(value) =>
                        updateScheduleEntry(entry.dayOfWeek, {
                          closeTime: value,
                        })
                      }
                      placeholder="17:00"
                      style={styles.timeField}
                    />
                  </View>

                  <View style={styles.timeRow}>
                    <CustomInput
                      value={entry.breakStartTime}
                      onChangeText={(value) =>
                        updateScheduleEntry(entry.dayOfWeek, {
                          breakStartTime: value,
                        })
                      }
                      placeholder="Break start"
                      style={styles.timeField}
                    />
                    <CustomInput
                      value={entry.breakEndTime}
                      onChangeText={(value) =>
                        updateScheduleEntry(entry.dayOfWeek, {
                          breakEndTime: value,
                        })
                      }
                      placeholder="Break end"
                      style={styles.timeField}
                    />
                  </View>
                </>
              ) : (
                <AdaptiveText style={styles.closedHint}>
                  Marked as closed for the whole day.
                </AdaptiveText>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          <AdaptiveText style={styles.saveButtonText}>
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Place"}
          </AdaptiveText>
        </TouchableOpacity>

        {isEditing ? (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={confirmDelete}
            disabled={isDeleting}
            activeOpacity={0.85}
          >
            <AdaptiveText style={styles.deleteButtonText}>
              {isDeleting ? "Deleting..." : "Delete Place"}
            </AdaptiveText>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {(isLoading || showLoadingOverlay) && <LoadingOverlay />}
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode }: { darkMode: boolean }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    emptyStateCard: {
      marginTop: 32,
      width: "92%",
    },
    content: {
      alignItems: "center",
      paddingBottom: 36,
      gap: 8,
    },
    heroCard: {
      width: "92%",
      marginTop: 18,
      padding: 20,
      borderRadius: 24,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      gap: 10,
    },
    title: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 24,
      lineHeight: 30,
    },
    subtitle: {
      fontFamily: "Poppins-Regular",
      fontSize: 14,
      lineHeight: 22,
      opacity: 0.84,
    },
    sectionLabel: {
      width: "84%",
      marginTop: 8,
      marginBottom: -4,
      fontFamily: "Poppins-Medium",
    },
    optionRow: {
      width: "84%",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 4,
    },
    optionChip: {
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    optionChipSelected: {
      backgroundColor: colors.green,
    },
    optionChipText: {
      fontFamily: "Poppins-Medium",
    },
    optionChipTextSelected: {
      color: colors.white,
    },
    descriptionInput: {
      width: "84%",
      minHeight: 160,
    },
    scheduleSection: {
      width: "92%",
      marginTop: 12,
      padding: 18,
      borderRadius: 24,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      gap: 14,
    },
    scheduleTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 18,
    },
    scheduleSubtitle: {
      fontFamily: "Poppins-Regular",
      fontSize: 13,
      lineHeight: 20,
      opacity: 0.8,
    },
    dayCard: {
      borderRadius: 18,
      padding: 14,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      gap: 10,
    },
    dayHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    dayTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 16,
    },
    closedToggle: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    closedToggleSelected: {
      backgroundColor: colors.red,
    },
    closedToggleText: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 12,
    },
    closedToggleTextSelected: {
      color: colors.white,
    },
    timeRow: {
      flexDirection: "row",
      gap: 10,
    },
    timeField: {
      flex: 1,
      width: "48%",
    },
    closedHint: {
      fontFamily: "Poppins-Regular",
      fontSize: 13,
      opacity: 0.8,
    },
    saveButton: {
      width: "84%",
      borderRadius: 20,
      paddingVertical: 18,
      marginTop: 14,
      backgroundColor: colors.green,
    },
    saveButtonText: {
      color: colors.white,
      fontFamily: "Poppins-Bold",
      fontSize: 18,
      textAlign: "center",
    },
    deleteButton: {
      width: "84%",
      borderRadius: 20,
      paddingVertical: 18,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      marginBottom: 20,
    },
    deleteButtonText: {
      color: colors.red,
      fontFamily: "Poppins-Bold",
      fontSize: 18,
      textAlign: "center",
    },
  });
