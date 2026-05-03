import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthProvider";
import { PlaceModel, PlaceReviewModel } from "@/data/models";
import {
  buildPlaceReviewSummary,
  deletePlaceReview,
  fetchPlaceReviews,
  savePlaceReview,
} from "@/lib/place-reviews";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { AdaptiveText } from "./AdaptiveText";
import CustomModal from "./CustomModal";
import { PlaceReviewCard } from "./PlaceReviewCard";
import { ProfileEmptyState } from "./ProfileEmptyState";

function getPlaceTypeLabel(place: PlaceModel) {
  if (place.Type === "Vet") return "vet";
  if (place.Type === "PetShop") return "pet shop";
  return "charity organisation";
}

function getEmptySubtitle(place: PlaceModel) {
  if (place.Type === "Vet") {
    return "Help other pet owners know what to expect from this vet clinic.";
  }

  if (place.Type === "PetShop") {
    return "Share how shopping here felt for you and your pet.";
  }

  return "Let others know how this charity organisation supports the pet community.";
}

export function PlaceReviewsSection({ place }: { place: PlaceModel }) {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { user } = useAuth();
  const [reviews, setReviews] = useState<PlaceReviewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComposerVisible, setIsComposerVisible] = useState(false);
  const [draftRating, setDraftRating] = useState(0);
  const [draftComment, setDraftComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);

    try {
      const nextReviews = await fetchPlaceReviews(place.Id, user);
      setReviews(nextReviews);
    } catch (error) {
      console.error("[place-reviews] Failed to load reviews", error);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [place.Id, user]);

  useFocusEffect(
    useCallback(() => {
      void loadReviews();

      return undefined;
    }, [loadReviews]),
  );

  const currentUserId = user ? String(user.Id) : null;
  const currentUserReview = useMemo(
    () =>
      currentUserId
        ? (reviews.find((review) => review.UserId === currentUserId) ?? null)
        : null,
    [currentUserId, reviews],
  );
  const summary = useMemo(() => {
    if (reviews.length > 0) {
      return buildPlaceReviewSummary(reviews);
    }

    if ((place.ReviewsCount ?? 0) > 0) {
      return {
        AverageRating: place.AverageRating ?? null,
        ReviewsCount: place.ReviewsCount ?? 0,
      };
    }

    return buildPlaceReviewSummary(reviews);
  }, [place.AverageRating, place.ReviewsCount, reviews]);
  const roundedAverageRating =
    summary.AverageRating === null ? 0 : Math.round(summary.AverageRating);
  const reviewCountLabel =
    summary.ReviewsCount === 1 ? "1 review" : `${summary.ReviewsCount} reviews`;

  const openComposer = useCallback(() => {
    if (!user) {
      Alert.alert(
        "Sign in required",
        "Please sign in to leave a review for this place.",
      );
      return;
    }

    setDraftRating(currentUserReview?.Rating ?? 0);
    setDraftComment(currentUserReview?.Comment ?? "");
    setIsComposerVisible(true);
  }, [currentUserReview?.Comment, currentUserReview?.Rating, user]);

  const closeComposer = useCallback(() => {
    if (isSaving) {
      return;
    }

    setIsComposerVisible(false);
  }, [isSaving]);

  const handleSaveReview = useCallback(async () => {
    if (!user) {
      Alert.alert(
        "Sign in required",
        "Please sign in before posting a review.",
      );
      return;
    }

    if (!draftRating) {
      Alert.alert("Missing rating", "Choose a rating from 1 to 5 stars.");
      return;
    }

    if (!draftComment.trim()) {
      Alert.alert(
        "Missing review",
        "Share a few words so other pet owners can learn from your experience.",
      );
      return;
    }

    setIsSaving(true);

    try {
      await savePlaceReview({
        placeId: place.Id,
        rating: draftRating,
        comment: draftComment,
        reviewId: currentUserReview?.Id ?? null,
        currentUser: user,
      });

      await loadReviews();
      setIsComposerVisible(false);
    } catch (error) {
      console.error("[place-reviews] Failed to save review", error);
      Alert.alert("Could not save review", "Please try again in a moment.");
    } finally {
      setIsSaving(false);
    }
  }, [
    currentUserReview?.Id,
    draftComment,
    draftRating,
    loadReviews,
    place.Id,
    user,
  ]);

  const confirmDeleteReview = useCallback(async () => {
    if (!user || !currentUserReview) {
      return;
    }

    setIsSaving(true);

    try {
      await deletePlaceReview(place.Id, currentUserReview.Id);
      await loadReviews();
      setDraftRating(0);
      setDraftComment("");
      setIsComposerVisible(false);
    } catch (error) {
      console.error("[place-reviews] Failed to delete review", error);
      Alert.alert("Could not delete review", "Please try again in a moment.");
    } finally {
      setIsSaving(false);
    }
  }, [currentUserReview, loadReviews, place.Id, user]);

  const handleDeletePress = useCallback(() => {
    if (!currentUserReview) {
      return;
    }

    Alert.alert(
      "Delete your review?",
      "This removes your saved review for this place.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void confirmDeleteReview();
          },
        },
      ],
    );
  }, [confirmDeleteReview, currentUserReview]);

  return (
    <View style={styles.section}>
      <AdaptiveText style={styles.sectionTitle}>Reviews</AdaptiveText>

      <View style={styles.summaryCard}>
        <View style={styles.summaryBody}>
          <AdaptiveText style={styles.summaryValue}>
            {summary.AverageRating?.toFixed(1) ?? "New"}
          </AdaptiveText>

          <View style={styles.summaryStars}>
            {Array.from({ length: 5 }).map((_, index) => (
              <FontAwesome
                key={`${place.Id}-summary-star-${index}`}
                name={index < roundedAverageRating ? "star" : "star-o"}
                size={16}
                color={colors.lightOrange}
              />
            ))}
          </View>

          <AdaptiveText style={styles.summaryLabel}>
            {summary.ReviewsCount === 0
              ? `Be the first to review this ${getPlaceTypeLabel(place)}.`
              : reviewCountLabel}
          </AdaptiveText>
        </View>

        <TouchableOpacity
          style={styles.primaryAction}
          onPress={openComposer}
          activeOpacity={0.85}
        >
          <AdaptiveText style={styles.primaryActionText}>
            {currentUserReview ? "Edit Your Review" : "Write A Review"}
          </AdaptiveText>
        </TouchableOpacity>
      </View>

      {currentUserReview ? (
        <AdaptiveText style={styles.helperText}>
          Your review is visible below and can be updated any time.
        </AdaptiveText>
      ) : null}

      {isLoading ? (
        <AdaptiveText style={styles.loadingText}>
          Loading reviews...
        </AdaptiveText>
      ) : reviews.length === 0 ? (
        <ProfileEmptyState
          title="No reviews yet"
          subtitle={getEmptySubtitle(place)}
          compact
          style={styles.emptyState}
        />
      ) : (
        <View>
          {reviews.map((review) => (
            <PlaceReviewCard
              key={review.Id}
              review={review}
              isCurrentUserReview={review.UserId === currentUserId}
            />
          ))}
        </View>
      )}

      <CustomModal visible={isComposerVisible} onClose={closeComposer}>
        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AdaptiveText style={styles.modalTitle}>
            {currentUserReview ? "Edit your review" : `Review ${place.Name}`}
          </AdaptiveText>
          <AdaptiveText style={styles.modalSubtitle}>
            Tell other pet owners what stood out about this{" "}
            {getPlaceTypeLabel(place)}.
          </AdaptiveText>

          <View style={styles.ratingSelector}>
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;

              return (
                <Pressable
                  key={`${place.Id}-draft-star-${value}`}
                  style={styles.ratingButton}
                  onPress={() => setDraftRating(value)}
                >
                  <FontAwesome
                    name={index < draftRating ? "star" : "star-o"}
                    size={34}
                    color={colors.lightOrange}
                  />
                </Pressable>
              );
            })}
          </View>

          <AdaptiveText style={styles.ratingHint}>
            {draftRating
              ? `${draftRating} out of 5 stars`
              : "Tap a star to rate this place."}
          </AdaptiveText>

          <TextInput
            style={styles.commentInput}
            value={draftComment}
            onChangeText={setDraftComment}
            placeholder="Share your experience..."
            placeholderTextColor={
              darkMode ? colors.lightGrey : colors.mildDarkGrey
            }
            multiline
            numberOfLines={5}
            maxLength={500}
            textAlignVertical="top"
            editable={!isSaving}
          />

          <AdaptiveText style={styles.characterCount}>
            {draftComment.trim().length}/500
          </AdaptiveText>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={closeComposer}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <AdaptiveText style={styles.secondaryActionText}>
                Cancel
              </AdaptiveText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryAction,
                isSaving ? styles.primaryActionDisabled : null,
              ]}
              onPress={() => {
                void handleSaveReview();
              }}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <AdaptiveText style={styles.primaryActionText}>
                {isSaving
                  ? "Saving..."
                  : currentUserReview
                    ? "Update Review"
                    : "Post Review"}
              </AdaptiveText>
            </TouchableOpacity>
          </View>

          {currentUserReview ? (
            <TouchableOpacity
              style={styles.deleteAction}
              onPress={handleDeletePress}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <AdaptiveText style={styles.deleteActionText}>
                Delete review
              </AdaptiveText>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </CustomModal>
    </View>
  );
}

const createStyles = ({ darkMode }: { darkMode: boolean }) =>
  StyleSheet.create({
    section: {
      marginHorizontal: 16,
      marginTop: 18,
      marginBottom: 100,
      padding: 18,
      borderRadius: 20,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    sectionTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 18,
      marginBottom: 14,
    },
    summaryCard: {
      borderRadius: 18,
      padding: 16,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      gap: 14,
    },
    summaryBody: {
      gap: 8,
    },
    summaryValue: {
      fontFamily: "Poppins-Bold",
      fontSize: 30,
    },
    summaryStars: {
      flexDirection: "row",
      gap: 4,
    },
    summaryLabel: {
      fontSize: 14,
      lineHeight: 20,
      opacity: 0.82,
    },
    primaryAction: {
      alignSelf: "flex-start",
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.green,
    },
    primaryActionDisabled: {
      opacity: 0.7,
    },
    primaryActionText: {
      color: colors.white,
      fontFamily: "Poppins-SemiBold",
      fontSize: 13,
    },
    helperText: {
      marginTop: 12,
      fontSize: 13,
      opacity: 0.78,
    },
    loadingText: {
      marginTop: 18,
      fontFamily: "Poppins-Medium",
      fontSize: 14,
    },
    emptyState: {
      width: "100%",
      marginTop: 16,
      marginBottom: 0,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    modalScroll: {
      width: "100%",
    },
    modalContent: {
      width: "100%",
      paddingBottom: 26,
    },
    modalTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 20,
      textAlign: "center",
    },
    modalSubtitle: {
      marginTop: 8,
      textAlign: "center",
      lineHeight: 21,
      opacity: 0.82,
    },
    ratingSelector: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 22,
      gap: 10,
    },
    ratingButton: {
      padding: 2,
    },
    ratingHint: {
      marginTop: 10,
      textAlign: "center",
      fontFamily: "Poppins-Medium",
      fontSize: 13,
    },
    commentInput: {
      minHeight: 130,
      marginTop: 20,
      borderRadius: 16,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: darkMode ? colors.white : colors.black,
      fontFamily: "Poppins-Regular",
      fontSize: 15,
      lineHeight: 22,
    },
    characterCount: {
      alignSelf: "flex-end",
      marginTop: 8,
      fontSize: 12,
      opacity: 0.72,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
      marginTop: 22,
    },
    secondaryAction: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    secondaryActionText: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 13,
    },
    deleteAction: {
      alignSelf: "center",
      marginTop: 18,
      paddingVertical: 6,
    },
    deleteActionText: {
      color: colors.red,
      fontFamily: "Poppins-SemiBold",
      fontSize: 13,
    },
  });
