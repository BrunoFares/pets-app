import { AdaptiveText } from "@/components/AdaptiveText";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import { colors } from "@/constants/colors";
import { PlaceModel } from "@/data/models";
import {
  fetchPlaceById,
  formatPlaceAddress,
  formatPlaceLocation,
} from "@/lib/discovery-api";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getPlaceDetailsTitle(place: PlaceModel | null) {
  if (place?.Type === "Vet") return "Vet Details";
  if (place?.Type === "PetShop") return "Pet Shop Details";
  return "Place Details";
}

export default function PlaceDetails() {
  const { key } = useLocalSearchParams<{ key?: string }>();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [place, setPlace] = useState<PlaceModel | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(key));

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadPlace = async () => {
        if (!key) {
          setPlace(null);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);

        try {
          const response = await fetchPlaceById(key);

          if (!isActive) return;

          setPlace(response);
        } catch (error) {
          if (!isActive) return;

          setPlace(null);
          Alert.alert(
            "Could not load place",
            error instanceof Error ? error.message : "Please try again.",
          );
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      void loadPlace();

      return () => {
        isActive = false;
      };
    }, [key]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title={getPlaceDetailsTitle(place)} />

      {place ? (
        <ScrollView contentContainerStyle={styles.content}>
          {place.Photo ? (
            <Image
              source={{ uri: place.Photo }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}

          <View style={styles.section}>
            <AdaptiveText style={styles.name}>{place.Name}</AdaptiveText>
            <AdaptiveText style={styles.location}>
              {formatPlaceLocation(place)}
            </AdaptiveText>
            <AdaptiveText style={styles.description}>
              {place.Description?.trim()
                ? place.Description
                : "No description has been added for this place yet."}
            </AdaptiveText>
          </View>

          <View style={styles.section}>
            <AdaptiveText style={styles.sectionTitle}>Contact</AdaptiveText>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Address</Text>
              <AdaptiveText style={styles.metaValue}>
                {formatPlaceAddress(place) || "Not provided"}
              </AdaptiveText>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Phone</Text>
              <AdaptiveText style={styles.metaValue}>
                {place.Phone || "Not provided"}
              </AdaptiveText>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Email</Text>
              <AdaptiveText style={styles.metaValue}>
                {place.Email || "Not provided"}
              </AdaptiveText>
            </View>
          </View>

          <View style={styles.section}>
            <AdaptiveText style={styles.sectionTitle}>Reviews</AdaptiveText>
            <ProfileEmptyState
              title="No reviews yet"
              subtitle="Community reviews are not available for this place yet."
              compact
              style={styles.reviewEmptyState}
            />
          </View>
        </ScrollView>
      ) : !isLoading ? (
        <View style={styles.emptyStateWrap}>
          <ProfileEmptyState
            title={key ? "Place unavailable" : "Missing place"}
            subtitle="We couldn't load the place details right now."
          />
        </View>
      ) : null}

      {isLoading && <LoadingOverlay />}
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
    reviewEmptyState: {
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
