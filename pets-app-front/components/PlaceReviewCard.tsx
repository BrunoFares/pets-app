import { colors } from "@/constants/colors";
import { PlaceReviewModel } from "@/data/models";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View, useColorScheme } from "react-native";
import { AdaptiveText } from "./AdaptiveText";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatReviewDate(review: PlaceReviewModel) {
  const value = review.UpdatedAt ?? review.CreatedAt;
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const label = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (review.UpdatedAt && review.UpdatedAt !== review.CreatedAt) {
    return `Edited ${label}`;
  }

  return label;
}

export function PlaceReviewCard({
  review,
  isCurrentUserReview = false,
}: {
  review: PlaceReviewModel;
  isCurrentUserReview?: boolean;
}) {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.userRow}>
          {review.UserImage ? (
            <Image
              source={{ uri: review.UserImage }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <AdaptiveText style={styles.avatarInitials}>
                {getInitials(review.UserName) || "U"}
              </AdaptiveText>
            </View>
          )}

          <View style={styles.userMeta}>
            <View style={styles.nameRow}>
              <AdaptiveText style={styles.userName}>{review.UserName}</AdaptiveText>
              {isCurrentUserReview ? (
                <View style={styles.badge}>
                  <AdaptiveText style={styles.badgeText}>You</AdaptiveText>
                </View>
              ) : null}
            </View>

            <AdaptiveText style={styles.dateLabel}>
              {formatReviewDate(review)}
            </AdaptiveText>
          </View>
        </View>

        <View style={styles.ratingRow}>
          {Array.from({ length: 5 }).map((_, index) => (
            <FontAwesome
              key={`${review.Id}-star-${index}`}
              name={index < review.Rating ? "star" : "star-o"}
              size={14}
              color={colors.lightOrange}
            />
          ))}
        </View>
      </View>

      <AdaptiveText style={styles.comment}>
        {review.Comment.trim() || "No written review."}
      </AdaptiveText>
    </View>
  );
}

const createStyles = ({ darkMode }: { darkMode: boolean }) =>
  StyleSheet.create({
    card: {
      borderRadius: 18,
      padding: 16,
      marginTop: 12,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    userRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    avatarPlaceholder: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    avatarInitials: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 14,
    },
    userMeta: {
      flex: 1,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    userName: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 15,
    },
    badge: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
      backgroundColor: darkMode ? colors.green : colors.lightLightGreen1,
    },
    badgeText: {
      fontFamily: "Poppins-Medium",
      fontSize: 11,
      color: darkMode ? colors.white : colors.darkGreen,
    },
    dateLabel: {
      marginTop: 2,
      fontSize: 12,
      opacity: 0.75,
    },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      marginTop: 2,
    },
    comment: {
      marginTop: 14,
      lineHeight: 22,
      fontSize: 14,
    },
  });
