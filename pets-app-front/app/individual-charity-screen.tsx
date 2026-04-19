import { AdaptiveText } from "@/components/AdaptiveText";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import { colors } from "@/constants/colors";
import { PlaceModel } from "@/data/models";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { presentApiError } from "@/lib/api-feedback";
import {
  fetchPlaceById,
  formatPlaceAddress,
  formatPlaceLocation,
} from "@/lib/discovery-api";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function IndividualCharityScreen() {
  const { key } = useLocalSearchParams<{ key?: string }>();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [organisation, setOrganisation] = useState<PlaceModel | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(key));

  const loadOrganisation = useCallback(async () => {
    if (!key) {
      setOrganisation(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetchPlaceById(key);
      setOrganisation(response.Type === "Other" ? response : null);
    } catch (error) {
      setOrganisation(null);
      presentApiError("Could not load charity organisation", error);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  useFocusEffect(
    useCallback(() => {
      void loadOrganisation();

      return undefined;
    }, [loadOrganisation]),
  );

  const { isRefreshing, onRefresh } = usePullToRefresh(loadOrganisation);
  const showLoadingOverlay = isLoading && !isRefreshing;

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Charity Organisation" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          !organisation ? styles.emptyStateWrap : null,
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {organisation ? (
          <>
            {organisation.Photo ? (
              <Image
                source={{ uri: organisation.Photo }}
                style={styles.image}
                contentFit="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder} />
            )}

            <View style={styles.section}>
              <AdaptiveText style={styles.name}>{organisation.Name}</AdaptiveText>
              <AdaptiveText style={styles.location}>
                {formatPlaceLocation(organisation)}
              </AdaptiveText>
              <AdaptiveText style={styles.description}>
                {organisation.Description?.trim()
                  ? organisation.Description
                  : "No description has been added for this charity organisation yet."}
              </AdaptiveText>
            </View>

            <View style={styles.section}>
              <AdaptiveText style={styles.sectionTitle}>Contact</AdaptiveText>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Address</Text>
                <AdaptiveText style={styles.metaValue}>
                  {formatPlaceAddress(organisation) || "Not provided"}
                </AdaptiveText>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Phone</Text>
                <AdaptiveText style={styles.metaValue}>
                  {organisation.Phone || "Not provided"}
                </AdaptiveText>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Email</Text>
                <AdaptiveText style={styles.metaValue}>
                  {organisation.Email || "Not provided"}
                </AdaptiveText>
              </View>
            </View>

            <View style={styles.section}>
              <AdaptiveText style={styles.sectionTitle}>
                Community Activity
              </AdaptiveText>
              <ProfileEmptyState
                title="No community posts yet"
                subtitle="This charity organisation does not have community feedback available right now."
                compact
                style={styles.emptyCard}
              />
            </View>
          </>
        ) : !isLoading ? (
          <ProfileEmptyState
            title={key ? "Charity organisation unavailable" : "Missing charity organisation"}
            subtitle="We couldn't load this charity organisation right now."
          />
        ) : null}
      </ScrollView>

      {showLoadingOverlay && <LoadingOverlay />}
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    content: {
      paddingBottom: 36,
    },
    image: {
      width: "100%",
      height: 320,
    },
    imagePlaceholder: {
      width: "100%",
      height: 320,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    section: {
      marginHorizontal: 16,
      marginTop: 18,
      padding: 18,
      borderRadius: 20,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    name: {
      fontSize: 24,
      fontFamily: "Poppins-SemiBold",
    },
    location: {
      marginTop: 4,
      fontFamily: "Poppins-Regular",
      opacity: 0.8,
    },
    description: {
      marginTop: 14,
      fontFamily: "Poppins-Regular",
      lineHeight: 24,
    },
    sectionTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 18,
      marginBottom: 14,
    },
    metaRow: {
      marginBottom: 14,
      gap: 4,
    },
    metaLabel: {
      color: darkMode ? colors.lightGrey : colors.darkGrey,
      fontFamily: "Poppins-Medium",
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    metaValue: {
      fontFamily: "Poppins-Regular",
      fontSize: 15,
      lineHeight: 22,
    },
    emptyCard: {
      width: "100%",
      marginTop: 0,
      marginBottom: 0,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    emptyStateWrap: {
      flex: 1,
      justifyContent: "center",
    },
  });
};
