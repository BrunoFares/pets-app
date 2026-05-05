import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import CustomModal from "@/components/CustomModal";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthProvider";
import { useGlobal } from "@/contexts/GlobalProvider";
import { PlaceModel, PlaceOwnerApplicationModel } from "@/data/models";
import { ApiRequestError } from "@/lib/api";
import { presentApiError } from "@/lib/api-feedback";
import { fetchPlaceById } from "@/lib/discovery-api";
import {
  createManagedPlace,
  createPlaceOwnerApplication,
  deleteManagedPlace,
  deleteManagedPlaceImage,
  fetchMyPlaceOwnerAccessStatus,
  ManagedPlaceInput,
  MAX_PLACE_IMAGES,
  uploadManagedPlaceImages,
  uploadPlaceOwnerApplicationImages,
  updateManagedPlace,
} from "@/lib/place-owner-api";
import {
  formatPlaceTypeLabel,
  normalizePlaceTypeForSelection,
  SupportedPlaceType,
} from "@/lib/place-type-utils";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { parseRoutePayload } from "@/lib/profile-api";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Platform,
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
type ScheduleTimeField =
  | "openTime"
  | "closeTime"
  | "breakStartTime"
  | "breakEndTime";

type EditableScheduleEntry = {
  dayOfWeek: DayName;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
  breakStartTime: string;
  breakEndTime: string;
};

type ActiveTimePicker = {
  day: DayName;
  field: ScheduleTimeField;
  value: Date;
};

const PLACE_TYPE_OPTIONS: SupportedPlaceType[] = ["Vet", "PetShop", "Charity"];
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

function normalizeTimeForEditor(value?: string | null) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.\d+)?)?$/.exec(
    trimmed,
  );

  if (!match) {
    return trimmed;
  }

  return `${match[1]}:${match[2]}`;
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
        openTime: normalizeTimeForEditor(entry.OpenTime),
        closeTime: normalizeTimeForEditor(entry.CloseTime),
        breakStartTime: normalizeTimeForEditor(entry.BreakStartTime),
        breakEndTime: normalizeTimeForEditor(entry.BreakEndTime),
      },
    ]),
  );

  return DAY_OPTIONS.map((day) => byDay.get(day) ?? defaultsByDay.get(day)!);
}

function parseTimeToMinutes(value: string) {
  const trimmed = value.trim();
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(trimmed);
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

function isBreakField(field: ScheduleTimeField) {
  return field === "breakStartTime" || field === "breakEndTime";
}

function timeStringToDate(value?: string | null) {
  const date = new Date();
  const parsedMinutes = value ? parseTimeToMinutes(value) : null;

  if (parsedMinutes === null) {
    date.setHours(9, 0, 0, 0);
    return date;
  }

  date.setHours(Math.floor(parsedMinutes / 60), parsedMinutes % 60, 0, 0);
  return date;
}

function formatTimeForStorage(value: Date) {
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getTimePlaceholder(field: ScheduleTimeField) {
  if (field === "openTime") return "Select opening";
  if (field === "closeTime") return "Select closing";
  if (field === "breakStartTime") return "Select break start";
  return "Select break end";
}

function getTimeFieldLabel(field: ScheduleTimeField) {
  if (field === "openTime") return "Opens";
  if (field === "closeTime") return "Closes";
  if (field === "breakStartTime") return "Break starts";
  return "Break ends";
}

function getTimePickerTitle(day: DayName, field: ScheduleTimeField) {
  return `${day} ${getTimeFieldLabel(field)}`;
}

export default function PlaceEditorScreen() {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const router = useRouter();
  const { id, payload } = useLocalSearchParams<{ id?: string; payload?: string }>();
  const { refreshProfile, user } = useAuth();
  const { setShowFooter } = useGlobal();
  const isEditing = Boolean(id);
  const [isOwnerAccessActive, setIsOwnerAccessActive] = useState(
    Boolean(user?.IsApprovedPlaceOwner),
  );
  const [isCheckingOwnerAccess, setIsCheckingOwnerAccess] = useState(!isEditing);
  const isOwnerActive = isOwnerAccessActive;
  const isApplicationMode = !isEditing && !isOwnerActive;
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
  const [placeType, setPlaceType] = useState<SupportedPlaceType>("Vet");
  const [placeStatus, setPlaceStatus] =
    useState<PlaceModel["Status"]>("Active");
  const [schedule, setSchedule] = useState<EditableScheduleEntry[]>(
    getDefaultSchedule(),
  );
  const [existingImages, setExistingImages] = useState<PlaceModel["Images"]>([]);
  const [selectedImageAssets, setSelectedImageAssets] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | number | null>(
    null,
  );
  const [activeTimePicker, setActiveTimePicker] =
    useState<ActiveTimePicker | null>(null);
  const [iosTimeValue, setIosTimeValue] = useState(new Date());

  const latestApplication = useMemo(() => {
    const parsed = parseRoutePayload<{ application?: PlaceOwnerApplicationModel }>(
      payload,
    );

    return parsed?.application ?? null;
  }, [payload]);

  const pageTitle = isApplicationMode
    ? "Register Place"
    : isEditing
      ? "Edit Place"
      : "Add Place";
  const heroTitle = isApplicationMode
    ? "Register your place"
    : isEditing
      ? "Update your listing"
      : "Create a new listing";
  const heroSubtitle = isApplicationMode
    ? "Share the core details for your vet clinic, pet shop, or charity so an admin can review the registration and activate your place-owner access."
    : "Keep the public details, visibility status, and weekly schedule in sync with how your place actually operates.";
  const nameLabel = isApplicationMode ? "Business Name" : "Place Name";
  const remainingImageSlots =
    MAX_PLACE_IMAGES - existingImages.length - selectedImageAssets.length;

  useEffect(() => {
    if (id) {
      return;
    }

    setName(latestApplication?.BusinessName ?? "");
    setPhone(latestApplication?.Phone ?? "");
    setEmail(latestApplication?.Email ?? user?.Email ?? "");
    setPhoto("");
    setDescription(latestApplication?.Description ?? "");
    setAddressLine1(latestApplication?.AddressLine1 ?? "");
    setAddressLine2(latestApplication?.AddressLine2 ?? "");
    setCity(latestApplication?.City ?? "");
    setCountry(latestApplication?.Country ?? "");
    setLatitude("");
    setLongitude("");
    setExistingImages([]);
    setSelectedImageAssets([]);
    setPlaceType(
      normalizePlaceTypeForSelection(latestApplication?.RequestedPlaceType),
    );
    setPlaceStatus("Active");
    setSchedule(getDefaultSchedule());
    setErrorMessage(null);
  }, [id, latestApplication, user?.Email]);

  const applyPlaceToForm = useCallback((nextPlace: PlaceModel) => {
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
    setPlaceType(normalizePlaceTypeForSelection(nextPlace.Type));
    setPlaceStatus(nextPlace.Status);
    setExistingImages(nextPlace.Images);
    setSelectedImageAssets([]);
    setSchedule(mapPlaceToEditableSchedule(nextPlace));
  }, []);

  const loadPlace = useCallback(async () => {
    if (!id) {
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetchPlaceById(id);

      if (user && String(response.OwnerUserId ?? "") !== String(user.Id)) {
        setErrorMessage("You can only edit places that belong to your account.");
        return;
      }

      setErrorMessage(null);
      applyPlaceToForm(response);
    } catch (error) {
      setErrorMessage("We couldn't load this place right now.");
      presentApiError("Could not load place", error);
    } finally {
      setIsLoading(false);
    }
  }, [applyPlaceToForm, id, user]);

  const loadOwnerAccessStatus = useCallback(async () => {
    if (!user || isEditing) {
      setIsOwnerAccessActive(Boolean(user?.IsApprovedPlaceOwner));
      setIsCheckingOwnerAccess(false);
      return;
    }

    setIsCheckingOwnerAccess(true);

    try {
      const nextOwnerAccess = await fetchMyPlaceOwnerAccessStatus();
      setIsOwnerAccessActive(nextOwnerAccess);

      if (nextOwnerAccess !== Boolean(user.IsApprovedPlaceOwner)) {
        void refreshProfile().catch(() => {
          return undefined;
        });
      }
    } catch {
      setIsOwnerAccessActive(Boolean(user?.IsApprovedPlaceOwner));
    } finally {
      setIsCheckingOwnerAccess(false);
    }
  }, [isEditing, refreshProfile, user]);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);
      void loadOwnerAccessStatus();
      void loadPlace();

      return () => {
        setShowFooter?.(true);
      };
    }, [loadOwnerAccessStatus, loadPlace, setShowFooter]),
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

  const clearBreakTimes = useCallback(
    (day: DayName) => {
      updateScheduleEntry(day, {
        breakStartTime: "",
        breakEndTime: "",
      });
    },
    [updateScheduleEntry],
  );

  const handlePickImages = useCallback(async () => {
    if (isSubmitting || remainingImageSlots <= 0) {
      return;
    }

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Please allow photo library access so you can attach images to this place.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: remainingImageSlots,
      quality: 0.9,
    });

    if (result.canceled) {
      return;
    }

    setSelectedImageAssets((currentAssets) => {
      const nextAssets = [...currentAssets];
      const seenKeys = new Set(
        currentAssets.map((asset) => asset.assetId ?? asset.uri),
      );

      for (const asset of result.assets) {
        const assetKey = asset.assetId ?? asset.uri;

        if (seenKeys.has(assetKey)) {
          continue;
        }

        nextAssets.push(asset);
        seenKeys.add(assetKey);

        if (nextAssets.length >= MAX_PLACE_IMAGES - existingImages.length) {
          break;
        }
      }

      return nextAssets;
    });
  }, [existingImages.length, isSubmitting, remainingImageSlots]);

  const handleRemoveSelectedImage = useCallback(
    (assetToRemove: ImagePicker.ImagePickerAsset) => {
      setSelectedImageAssets((currentAssets) =>
        currentAssets.filter((asset) => asset.uri !== assetToRemove.uri),
      );
    },
    [],
  );

  const confirmRemoveExistingImage = useCallback(
    (image: PlaceModel["Images"][number]) => {
      if (!id || deletingImageId !== null || isSubmitting) {
        return;
      }

      Alert.alert(
        "Remove this photo?",
        "This photo will be removed from the place listing.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => {
              void (async () => {
                try {
                  setDeletingImageId(image.Id);
                  await deleteManagedPlaceImage(id, image.Id);
                  setExistingImages((currentImages) =>
                    currentImages.filter(
                      (currentImage) => currentImage.Id !== image.Id,
                    ),
                  );
                } catch (error) {
                  presentApiError("Could not remove photo", error, {
                    fallbackMessage:
                      "We couldn't remove this photo right now.",
                  });
                } finally {
                  setDeletingImageId(null);
                }
              })();
            },
          },
        ],
      );
    },
    [deletingImageId, id, isSubmitting],
  );

  const openTimePicker = useCallback(
    (day: DayName, field: ScheduleTimeField, currentValue: string) => {
      const nextValue = timeStringToDate(currentValue);
      setIosTimeValue(nextValue);
      setActiveTimePicker({
        day,
        field,
        value: nextValue,
      });
    },
    [],
  );

  const closeTimePicker = useCallback(() => {
    setActiveTimePicker(null);
  }, []);

  const applySelectedTime = useCallback(
    (day: DayName, field: ScheduleTimeField, value: Date) => {
      updateScheduleEntry(day, {
        [field]: formatTimeForStorage(value),
      } as Partial<EditableScheduleEntry>);
    },
    [updateScheduleEntry],
  );

  const handleTimePickerChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (!activeTimePicker) {
        return;
      }

      if (Platform.OS === "android") {
        if (event.type === "dismissed") {
          closeTimePicker();
          return;
        }

        if (selectedDate) {
          applySelectedTime(
            activeTimePicker.day,
            activeTimePicker.field,
            selectedDate,
          );
        }

        closeTimePicker();
        return;
      }

      if (selectedDate) {
        setIosTimeValue(selectedDate);
      }
    },
    [activeTimePicker, applySelectedTime, closeTimePicker],
  );

  const confirmIosTimeSelection = useCallback(() => {
    if (!activeTimePicker) {
      return;
    }

    applySelectedTime(activeTimePicker.day, activeTimePicker.field, iosTimeValue);
    closeTimePicker();
  }, [activeTimePicker, applySelectedTime, closeTimePicker, iosTimeValue]);

  const clearActiveBreakTimes = useCallback(() => {
    if (!activeTimePicker) {
      return;
    }

    clearBreakTimes(activeTimePicker.day);
    closeTimePicker();
  }, [activeTimePicker, clearBreakTimes, closeTimePicker]);

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
        "Please complete the required place details before continuing.",
      );
      return;
    }

    if (isApplicationMode) {
      try {
        setIsSubmitting(true);

        await createPlaceOwnerApplication({
          businessName: name,
          phone,
          email,
          description,
          addressLine1,
          addressLine2,
          city,
          country,
          requestedPlaceType: placeType,
        });

        if (selectedImageAssets.length > 0) {
          try {
            await uploadPlaceOwnerApplicationImages(selectedImageAssets);
          } catch {
            Alert.alert(
              "Registration submitted without images",
              "Your registration was submitted, but the selected images could not be uploaded.",
            );
            router.replace("/profile/place-manager");
            return;
          }
        }

        router.replace("/profile/place-manager");
      } catch (error) {
        presentApiError("Could not submit registration", error, {
          fallbackMessage:
            "We couldn't submit your place registration right now.",
        });
      } finally {
        setIsSubmitting(false);
      }

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

      const savedPlace = id
        ? await updateManagedPlace(id, payload)
        : await createManagedPlace(payload);

      if (selectedImageAssets.length > 0) {
        try {
          await uploadManagedPlaceImages(savedPlace.Id, selectedImageAssets);
        } catch {
          Alert.alert(
            "Place saved without new images",
            "Your place details were saved, but the selected images could not be uploaded.",
          );
          router.back();
          return;
        }
      }

      router.back();
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 403) {
        Alert.alert(
          "Place-owner access required",
          "This session is not currently allowed to publish places. If your place-owner approval was granted recently, refresh Place Manager or sign out and back in, then try again.",
        );
        void loadOwnerAccessStatus();
        return;
      }

      presentApiError("Could not save place", error, {
        fallbackMessage: "We couldn't save your place details right now.",
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

  const showLoadingOverlay =
    isSubmitting ||
    isDeleting ||
    isCheckingOwnerAccess ||
    deletingImageId !== null;

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title={pageTitle} />
        <ProfileEmptyState
          title="Sign in required"
          subtitle="Log in to register or manage your place listings."
          style={styles.emptyStateCard}
        />
      </SafeAreaView>
    );
  }

  if (isEditing && !isOwnerActive) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title={pageTitle} />
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
        <PageHeader title={pageTitle} />
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
      <PageHeader title={pageTitle} />

      <ScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        contentContainerStyle={styles.content}
      >
        <View style={styles.heroCard}>
          <AdaptiveText style={styles.title}>{heroTitle}</AdaptiveText>
          <AdaptiveText style={styles.subtitle}>{heroSubtitle}</AdaptiveText>

          {isApplicationMode ? (
            <View style={styles.helperCard}>
              <AdaptiveText style={styles.helperCardText}>
                Hours, listing status, and map coordinates unlock after your
                place-owner registration is approved.
              </AdaptiveText>
            </View>
          ) : null}
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
                  {formatPlaceTypeLabel(option)}
                </AdaptiveText>
              </TouchableOpacity>
            );
          })}
        </View>

        {!isApplicationMode ? (
          <>
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
          </>
        ) : null}

        <AdaptiveText style={styles.sectionLabel}>{nameLabel}</AdaptiveText>
        <CustomInput value={name} onChangeText={setName} />

        <AdaptiveText style={styles.sectionLabel}>Phone</AdaptiveText>
        <PhoneNumberInput value={phone} onChangeText={setPhone} />

        <AdaptiveText style={styles.sectionLabel}>Email</AdaptiveText>
        <CustomInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.imagesSection}>
          <View style={styles.imagesHeader}>
            <AdaptiveText style={styles.sectionLabel}>
              {isApplicationMode ? "Registration Images" : "Place Images"}
            </AdaptiveText>
            <AdaptiveText style={styles.imagesCounter}>
              {existingImages.length + selectedImageAssets.length}/{MAX_PLACE_IMAGES}
            </AdaptiveText>
          </View>

          <AdaptiveText style={styles.imagesHint}>
            Add up to {MAX_PLACE_IMAGES} images from your gallery.
          </AdaptiveText>

          <TouchableOpacity
            style={[
              styles.imagePickerButton,
              (isSubmitting || remainingImageSlots <= 0) &&
                styles.imagePickerButtonDisabled,
            ]}
            disabled={isSubmitting || remainingImageSlots <= 0}
            onPress={handlePickImages}
            activeOpacity={0.85}
          >
            <Ionicons
              name="images-outline"
              size={18}
              color={darkMode ? colors.white : colors.black}
            />
            <AdaptiveText style={styles.imagePickerButtonText}>
              {remainingImageSlots <= 0
                ? "Image limit reached"
                : selectedImageAssets.length > 0
                  ? "Add more images"
                  : "Choose images"}
            </AdaptiveText>
          </TouchableOpacity>

          {existingImages.length > 0 ? (
            <View style={styles.imageGroup}>
              <AdaptiveText style={styles.imageGroupLabel}>
                Current images
              </AdaptiveText>
              <View style={styles.imageGrid}>
                {existingImages.map((image) => (
                  <View key={String(image.Id)} style={styles.imageCard}>
                    <Image
                      source={{ uri: image.Url }}
                      style={styles.imagePreview}
                    />
                    {isEditing ? (
                      <TouchableOpacity
                        onPress={() => confirmRemoveExistingImage(image)}
                        style={styles.removeImageButton}
                        disabled={deletingImageId !== null || isSubmitting}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name="close"
                          size={14}
                          color={colors.white}
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {selectedImageAssets.length > 0 ? (
            <View style={styles.imageGroup}>
              <AdaptiveText style={styles.imageGroupLabel}>
                Selected images
              </AdaptiveText>
              <View style={styles.imageGrid}>
                {selectedImageAssets.map((asset) => (
                  <View
                    key={asset.assetId ?? asset.uri}
                    style={styles.imageCard}
                  >
                    <Image
                      source={{ uri: asset.uri }}
                      style={styles.imagePreview}
                    />
                    <TouchableOpacity
                      onPress={() => handleRemoveSelectedImage(asset)}
                      style={styles.removeImageButton}
                    >
                      <Ionicons
                        name="close"
                        size={14}
                        color={colors.white}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>

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

        {!isApplicationMode ? (
          <>
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
                Tap each field to choose a time. Leave break times empty if you
                do not close mid-day.
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
                        <View style={styles.timeGroup}>
                          <AdaptiveText style={styles.timeGroupLabel}>
                            Opens
                          </AdaptiveText>
                          <TouchableOpacity
                            style={styles.timeSelector}
                            onPress={() =>
                              openTimePicker(
                                entry.dayOfWeek,
                                "openTime",
                                entry.openTime,
                              )
                            }
                            activeOpacity={0.85}
                          >
                            <AdaptiveText
                              style={[
                                styles.timeSelectorText,
                                !entry.openTime
                                  ? styles.timeSelectorPlaceholder
                                  : null,
                              ]}
                            >
                              {entry.openTime || getTimePlaceholder("openTime")}
                            </AdaptiveText>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.timeGroup}>
                          <AdaptiveText style={styles.timeGroupLabel}>
                            Closes
                          </AdaptiveText>
                          <TouchableOpacity
                            style={styles.timeSelector}
                            onPress={() =>
                              openTimePicker(
                                entry.dayOfWeek,
                                "closeTime",
                                entry.closeTime,
                              )
                            }
                            activeOpacity={0.85}
                          >
                            <AdaptiveText
                              style={[
                                styles.timeSelectorText,
                                !entry.closeTime
                                  ? styles.timeSelectorPlaceholder
                                  : null,
                              ]}
                            >
                              {entry.closeTime || getTimePlaceholder("closeTime")}
                            </AdaptiveText>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.timeRow}>
                        <View style={styles.timeGroup}>
                          <AdaptiveText style={styles.timeGroupLabel}>
                            Break starts
                          </AdaptiveText>
                          <TouchableOpacity
                            style={styles.timeSelector}
                            onPress={() =>
                              openTimePicker(
                                entry.dayOfWeek,
                                "breakStartTime",
                                entry.breakStartTime,
                              )
                            }
                            activeOpacity={0.85}
                          >
                            <AdaptiveText
                              style={[
                                styles.timeSelectorText,
                                !entry.breakStartTime
                                  ? styles.timeSelectorPlaceholder
                                  : null,
                              ]}
                            >
                              {entry.breakStartTime ||
                                getTimePlaceholder("breakStartTime")}
                            </AdaptiveText>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.timeGroup}>
                          <AdaptiveText style={styles.timeGroupLabel}>
                            Break ends
                          </AdaptiveText>
                          <TouchableOpacity
                            style={styles.timeSelector}
                            onPress={() =>
                              openTimePicker(
                                entry.dayOfWeek,
                                "breakEndTime",
                                entry.breakEndTime,
                              )
                            }
                            activeOpacity={0.85}
                          >
                            <AdaptiveText
                              style={[
                                styles.timeSelectorText,
                                !entry.breakEndTime
                                  ? styles.timeSelectorPlaceholder
                                  : null,
                              ]}
                            >
                              {entry.breakEndTime ||
                                getTimePlaceholder("breakEndTime")}
                            </AdaptiveText>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {entry.breakStartTime || entry.breakEndTime ? (
                        <TouchableOpacity
                          style={styles.clearBreakButton}
                          onPress={() => clearBreakTimes(entry.dayOfWeek)}
                          activeOpacity={0.85}
                        >
                          <AdaptiveText style={styles.clearBreakButtonText}>
                            Clear break
                          </AdaptiveText>
                        </TouchableOpacity>
                      ) : null}
                    </>
                  ) : (
                    <AdaptiveText style={styles.closedHint}>
                      Marked as closed for the whole day.
                    </AdaptiveText>
                  )}
                </View>
              ))}
            </View>
          </>
        ) : null}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          <AdaptiveText style={styles.saveButtonText}>
            {isSubmitting
              ? isApplicationMode
                ? "Submitting..."
                : "Saving..."
              : isApplicationMode
                ? "Submit Registration"
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

      {Platform.OS === "android" && activeTimePicker ? (
        <DateTimePicker
          value={activeTimePicker.value}
          mode="time"
          is24Hour
          onChange={handleTimePickerChange}
        />
      ) : null}

      {Platform.OS === "ios" && activeTimePicker ? (
        <CustomModal
          visible
          onClose={closeTimePicker}
          style={styles.timePickerModal}
        >
          <View style={styles.timePickerModalContent}>
            <AdaptiveText style={styles.timePickerTitle}>
              {getTimePickerTitle(activeTimePicker.day, activeTimePicker.field)}
            </AdaptiveText>

            <DateTimePicker
              value={iosTimeValue}
              mode="time"
              display="spinner"
              is24Hour
              onChange={handleTimePickerChange}
              style={styles.iosTimePicker}
            />

            <View style={styles.timePickerActions}>
              {isBreakField(activeTimePicker.field) ? (
                <TouchableOpacity
                  style={styles.secondaryPickerButton}
                  onPress={clearActiveBreakTimes}
                  activeOpacity={0.85}
                >
                  <AdaptiveText style={styles.secondaryPickerButtonText}>
                    Clear Break
                  </AdaptiveText>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.secondaryPickerButton}
                onPress={closeTimePicker}
                activeOpacity={0.85}
              >
                <AdaptiveText style={styles.secondaryPickerButtonText}>
                  Cancel
                </AdaptiveText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryPickerButton}
                onPress={confirmIosTimeSelection}
                activeOpacity={0.85}
              >
                <AdaptiveText style={styles.primaryPickerButtonText}>
                  Done
                </AdaptiveText>
              </TouchableOpacity>
            </View>
          </View>
        </CustomModal>
      ) : null}

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
    helperCard: {
      marginTop: 4,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    helperCardText: {
      fontFamily: "Poppins-Regular",
      fontSize: 13,
      lineHeight: 20,
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
    imagesSection: {
      width: "84%",
      marginBottom: 6,
    },
    imagesHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    imagesCounter: {
      fontSize: 13,
      fontFamily: "Poppins-Medium",
      color: darkMode ? colors.lightGrey : colors.darkGrey,
    },
    imagesHint: {
      marginBottom: 12,
      fontSize: 14,
      fontFamily: "Poppins-Regular",
      lineHeight: 20,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
    },
    imagePickerButton: {
      minHeight: 52,
      borderRadius: 18,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginBottom: 12,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    imagePickerButtonDisabled: {
      opacity: 0.6,
    },
    imagePickerButtonText: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 14,
    },
    imageGroup: {
      marginBottom: 12,
    },
    imageGroupLabel: {
      marginBottom: 8,
      fontSize: 13,
      fontFamily: "Poppins-Medium",
      opacity: 0.8,
    },
    imageGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    imageCard: {
      position: "relative",
      width: 88,
      height: 88,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    imagePreview: {
      width: "100%",
      height: "100%",
    },
    removeImageButton: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
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
    timeGroup: {
      flex: 1,
      gap: 6,
    },
    timeGroupLabel: {
      fontFamily: "Poppins-Medium",
      fontSize: 12,
      opacity: 0.8,
    },
    timeSelector: {
      minHeight: 54,
      borderRadius: 16,
      paddingHorizontal: 14,
      justifyContent: "center",
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    timeSelectorText: {
      fontFamily: "Poppins-Medium",
      fontSize: 14,
    },
    timeSelectorPlaceholder: {
      opacity: 0.58,
    },
    clearBreakButton: {
      alignSelf: "flex-start",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    clearBreakButtonText: {
      color: colors.red,
      fontFamily: "Poppins-SemiBold",
      fontSize: 12,
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
    timePickerModal: {
      paddingBottom: 28,
    },
    timePickerModalContent: {
      width: "100%",
      alignItems: "center",
      gap: 8,
    },
    timePickerTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 20,
      textAlign: "center",
    },
    iosTimePicker: {
      width: "100%",
    },
    timePickerActions: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "flex-end",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 8,
    },
    secondaryPickerButton: {
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.lightGrey,
    },
    secondaryPickerButtonText: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 14,
    },
    primaryPickerButton: {
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 12,
      backgroundColor: colors.green,
    },
    primaryPickerButtonText: {
      color: colors.white,
      fontFamily: "Poppins-SemiBold",
      fontSize: 14,
    },
  });
