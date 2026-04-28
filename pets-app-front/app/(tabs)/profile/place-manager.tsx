import { AdaptiveText } from "@/components/AdaptiveText";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthProvider";
import { PlaceModel, PlaceOwnerApplicationModel } from "@/data/models";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { presentApiError } from "@/lib/api-feedback";
import {
  fetchMyPlaceOwnerAccessStatus,
  fetchMyPlaceOwnerApplication,
  fetchOwnedPlaces,
  formatPlaceOwnerApplicationStatusLabel,
  getPlaceOwnerApplicationStatusTone,
} from "@/lib/place-owner-api";
import { formatPlaceTypeLabel } from "@/lib/place-type-utils";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatDateLabel(value?: string | number | null) {
  if (!value) {
    return "Unknown";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getManagerState(
  application: PlaceOwnerApplicationModel | null,
  isApprovedPlaceOwner: boolean,
) {
  if (isApprovedPlaceOwner) return "approved";
  if (application?.Status === "Pending") return "pending";
  if (application?.Status === "Rejected") return "rejected";
  if (application?.Status === "Approved") return "inactive-approved";
  return "not-applied";
}

function getManagerSummary(
  state:
    | "approved"
    | "pending"
    | "rejected"
    | "inactive-approved"
    | "not-applied",
) {
  if (state === "approved") {
    return {
      badge: "Owner Active",
      title: "You can publish and manage your places.",
      description:
        "Create new listings, keep details up to date, and review how your place appears in the directory.",
      actionLabel: "Add A Place",
    };
  }

  if (state === "pending") {
    return {
      badge: "Registration Pending",
      title: "Your place-owner request is under review.",
      description:
        "An admin still needs to review your business details before you can manage listings from the app.",
      actionLabel: null,
    };
  }

  if (state === "rejected") {
    return {
      badge: "Needs Update",
      title: "Your latest place registration was rejected.",
      description:
        "You can review the notes below, fix the details, and submit the registration again when you are ready.",
      actionLabel: "Register Again",
    };
  }

  if (state === "inactive-approved") {
    return {
      badge: "Approval Inactive",
      title: "Your previous owner approval is not active right now.",
      description:
        "You can submit a new place registration from here if you still need access to manage your place.",
      actionLabel: "Register Again",
    };
  }

  return {
    badge: "Register First",
    title: "Register your place from your account.",
    description:
      "Tell us about your vet clinic, pet shop, or charity organisation and an admin can review the registration.",
    actionLabel: "Start Registration",
  };
}

function getApplicationToneColor(
  tone: "approved" | "rejected" | "pending",
  darkMode: boolean,
) {
  if (tone === "approved") {
    return {
      backgroundColor: darkMode ? colors.green : colors.lightLightGreen1,
      textColor: darkMode ? colors.white : colors.darkGreen,
    };
  }

  if (tone === "rejected") {
    return {
      backgroundColor: darkMode ? colors.red : colors.lightLightOrange,
      textColor: darkMode ? colors.white : colors.red,
    };
  }

  return {
    backgroundColor: darkMode ? colors.darkTurquoise : colors.lightTurquoise,
    textColor: darkMode ? colors.white : colors.darkTurquoise,
  };
}

export default function PlaceManagerScreen() {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const router = useRouter();
  const { isAuthenticated, refreshProfile, user } = useAuth();
  const [application, setApplication] =
    useState<PlaceOwnerApplicationModel | null>(null);
  const [ownedPlaces, setOwnedPlaces] = useState<PlaceModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwnerAccessActive, setIsOwnerAccessActive] = useState(
    Boolean(user?.IsApprovedPlaceOwner),
  );

  const loadManagerState = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setApplication(null);
      setOwnedPlaces([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [nextApplication, nextOwnerAccess] = await Promise.all([
        fetchMyPlaceOwnerApplication(),
        fetchMyPlaceOwnerAccessStatus(),
      ]);
      const nextOwnedPlaces = nextOwnerAccess
        ? await fetchOwnedPlaces(user.Id)
        : [];

      setApplication(nextApplication);
      setIsOwnerAccessActive(nextOwnerAccess);
      setOwnedPlaces(nextOwnedPlaces);

      if (nextOwnerAccess !== Boolean(user.IsApprovedPlaceOwner)) {
        void refreshProfile().catch(() => {
          return undefined;
        });
      }
    } catch (error) {
      setApplication(null);
      setIsOwnerAccessActive(Boolean(user?.IsApprovedPlaceOwner));
      setOwnedPlaces([]);
      presentApiError("Could not load place manager", error, {
        fallbackMessage: "We couldn't load your place manager tools right now.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshProfile, user]);

  useFocusEffect(
    useCallback(() => {
      void loadManagerState();
      return undefined;
    }, [loadManagerState]),
  );

  const { isRefreshing, onRefresh } = usePullToRefresh(loadManagerState);
  const showLoadingOverlay = isLoading && !isRefreshing;
  const managerState = useMemo(
    () => getManagerState(application, isOwnerAccessActive),
    [application, isOwnerAccessActive],
  );
  const summary = getManagerSummary(managerState);
  const applicationTone = application
    ? getPlaceOwnerApplicationStatusTone(application.Status)
    : "pending";
  const toneColors = getApplicationToneColor(applicationTone, darkMode);

  const openRegistrationForm = useCallback(() => {
    router.push({
      pathname: "/profile/place-editor",
      params: application
        ? {
            payload: encodeURIComponent(
              JSON.stringify({
                application,
              }),
            ),
          }
        : {},
    });
  }, [application, router]);

  const openPlaceEditor = useCallback(
    (placeId?: string) => {
      router.push({
        pathname: "/profile/place-editor",
        params: placeId ? { id: placeId } : {},
      });
    },
    [router],
  );

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="Place Manager" />
        <ProfileEmptyState
          title="Sign in required"
          subtitle="Log in to apply for place-owner access or manage your listings."
          style={styles.guestState}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Place Manager" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <AdaptiveText style={styles.heroBadgeText}>
              {summary.badge}
            </AdaptiveText>
          </View>

          <AdaptiveText style={styles.heroTitle}>{summary.title}</AdaptiveText>
          <AdaptiveText style={styles.heroDescription}>
            {summary.description}
          </AdaptiveText>

          {summary.actionLabel ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={
                managerState === "approved"
                  ? () => openPlaceEditor()
                  : openRegistrationForm
              }
              activeOpacity={0.85}
            >
              <AdaptiveText style={styles.primaryButtonText}>
                {summary.actionLabel}
              </AdaptiveText>
            </TouchableOpacity>
          ) : null}
        </View>

        {application && application.Status !== "Approved" ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AdaptiveText style={styles.sectionTitle}>
                Latest Registration
              </AdaptiveText>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: toneColors.backgroundColor },
                ]}
              >
                <AdaptiveText
                  style={[
                    styles.statusBadgeText,
                    { color: toneColors.textColor },
                  ]}
                >
                  {formatPlaceOwnerApplicationStatusLabel(application.Status)}
                </AdaptiveText>
              </View>
            </View>

            <AdaptiveText style={styles.applicationBusiness}>
              {application.BusinessName}
            </AdaptiveText>
            <AdaptiveText style={styles.applicationMeta}>
              {formatPlaceTypeLabel(application.RequestedPlaceType)} · {application.City},{" "}
              {application.Country}
            </AdaptiveText>

            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <AdaptiveText style={styles.infoLabel}>Submitted</AdaptiveText>
                <AdaptiveText style={styles.infoValue}>
                  {formatDateLabel(application.CreatedAt)}
                </AdaptiveText>
              </View>

              <View style={styles.infoCard}>
                <AdaptiveText style={styles.infoLabel}>Reviewed</AdaptiveText>
                <AdaptiveText style={styles.infoValue}>
                  {formatDateLabel(application.ReviewedAt)}
                </AdaptiveText>
              </View>
            </View>

            {application.Description?.trim() ? (
              <AdaptiveText style={styles.applicationCopy}>
                {application.Description}
              </AdaptiveText>
            ) : null}

            {application.RejectionReason?.trim() ? (
              <View style={styles.noteCard}>
                <AdaptiveText style={styles.noteTitle}>
                  Rejection Reason
                </AdaptiveText>
                <AdaptiveText style={styles.noteCopy}>
                  {application.RejectionReason}
                </AdaptiveText>
              </View>
            ) : null}

            {application.AdminNotes?.trim() ? (
              <View style={styles.noteCard}>
                <AdaptiveText style={styles.noteTitle}>
                  Admin Notes
                </AdaptiveText>
                <AdaptiveText style={styles.noteCopy}>
                  {application.AdminNotes}
                </AdaptiveText>
              </View>
            ) : null}
          </View>
        ) : null}

        {managerState === "approved" ? (
          <View style={[styles.section, { marginBottom: 70 }]}>
            <View style={styles.sectionHeader}>
              <AdaptiveText style={styles.sectionTitle}>
                My Managed Places
              </AdaptiveText>

              <TouchableOpacity
                onPress={() => openPlaceEditor()}
                activeOpacity={0.75}
              >
                <AdaptiveText style={styles.linkAction}>Add New</AdaptiveText>
              </TouchableOpacity>
            </View>

            {ownedPlaces.length === 0 ? (
              <ProfileEmptyState
                compact
                title="No places published yet"
                subtitle="Create your first listing to make it visible in the directory."
                style={styles.emptyState}
              />
            ) : (
              ownedPlaces.map((place) => (
                <TouchableOpacity
                  key={place.Id}
                  style={styles.placeCard}
                  onPress={() => openPlaceEditor(place.Id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.placeCardTop}>
                    <View style={styles.placeCopy}>
                      <AdaptiveText style={styles.placeName}>
                        {place.Name}
                      </AdaptiveText>
                      <AdaptiveText style={styles.placeMeta}>
                        {place.Type} · {place.City}, {place.Country}
                      </AdaptiveText>
                    </View>

                    <Feather
                      name="arrow-right"
                      size={20}
                      color={darkMode ? colors.white : colors.black}
                    />
                  </View>

                  <AdaptiveText style={styles.placeDescription}>
                    {place.Description?.trim()
                      ? place.Description
                      : "No description added yet."}
                  </AdaptiveText>

                  <View style={styles.infoGrid}>
                    <View style={styles.infoCard}>
                      <AdaptiveText style={styles.infoLabel}>
                        Status
                      </AdaptiveText>
                      <AdaptiveText style={styles.infoValue}>
                        {place.Status}
                      </AdaptiveText>
                    </View>

                    <View style={styles.infoCard}>
                      <AdaptiveText style={styles.infoLabel}>
                        Reviews
                      </AdaptiveText>
                      <AdaptiveText style={styles.infoValue}>
                        {place.ReviewsCount}
                      </AdaptiveText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

      {showLoadingOverlay && <LoadingOverlay />}
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode }: { darkMode: boolean }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    guestState: {
      marginTop: 32,
      width: "92%",
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 36,
      gap: 18,
    },
    heroCard: {
      marginTop: 18,
      padding: 20,
      borderRadius: 24,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      gap: 12,
    },
    heroBadge: {
      alignSelf: "flex-start",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    heroBadgeText: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 12,
    },
    heroTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 24,
      lineHeight: 30,
    },
    heroDescription: {
      fontFamily: "Poppins-Regular",
      fontSize: 14,
      lineHeight: 22,
      opacity: 0.82,
    },
    primaryButton: {
      alignSelf: "flex-start",
      marginTop: 4,
      borderRadius: 18,
      paddingHorizontal: 18,
      paddingVertical: 12,
      backgroundColor: colors.green,
    },
    primaryButtonText: {
      color: colors.white,
      fontFamily: "Poppins-SemiBold",
      fontSize: 14,
    },
    section: {
      padding: 18,
      borderRadius: 24,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      gap: 14,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    sectionTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 18,
    },
    linkAction: {
      color: colors.green,
      fontFamily: "Poppins-SemiBold",
      fontSize: 14,
    },
    statusBadge: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    statusBadgeText: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 12,
    },
    applicationBusiness: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 20,
    },
    applicationMeta: {
      fontFamily: "Poppins-Regular",
      fontSize: 14,
      opacity: 0.82,
    },
    applicationCopy: {
      fontFamily: "Poppins-Regular",
      fontSize: 14,
      lineHeight: 22,
    },
    noteCard: {
      borderRadius: 18,
      padding: 14,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      gap: 6,
    },
    noteTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 14,
    },
    noteCopy: {
      fontFamily: "Poppins-Regular",
      fontSize: 14,
      lineHeight: 21,
    },
    infoGrid: {
      flexDirection: "row",
      gap: 12,
    },
    infoCard: {
      flex: 1,
      borderRadius: 18,
      padding: 14,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      gap: 4,
    },
    infoLabel: {
      fontFamily: "Poppins-Medium",
      fontSize: 12,
      opacity: 0.74,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    infoValue: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 14,
    },
    emptyState: {
      width: "100%",
      marginTop: 0,
      marginBottom: 0,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    placeCard: {
      borderRadius: 20,
      padding: 16,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      gap: 12,
    },
    placeCardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    placeCopy: {
      flex: 1,
      gap: 4,
    },
    placeName: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 17,
    },
    placeMeta: {
      fontFamily: "Poppins-Regular",
      fontSize: 13,
      opacity: 0.8,
    },
    placeDescription: {
      fontFamily: "Poppins-Regular",
      fontSize: 14,
      lineHeight: 21,
    },
  });
