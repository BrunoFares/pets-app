import {
  AppUsersModel,
  PlaceReviewModel,
  PlaceReviewSummaryModel,
} from "@/data/models";
import { apiRequest } from "@/lib/api";

const PLACE_REVIEWS_PAGE_SIZE = 100;

type ApiPlaceReviewResponse = {
  id: string;
  placeId: string;
  userId: number;
  userDisplayName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

type ApiPlaceReviewListResponse = {
  items: ApiPlaceReviewResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type SavePlaceReviewInput = {
  placeId: string;
  rating: number;
  comment: string;
  reviewId?: string | null;
  currentUser?: Pick<AppUsersModel, "Id" | "Image"> | null;
};

function getCurrentUserImageForReview(
  review: ApiPlaceReviewResponse,
  currentUser?: Pick<AppUsersModel, "Id" | "Image"> | null,
) {
  if (!currentUser) {
    return null;
  }

  return String(currentUser.Id) === String(review.userId)
    ? currentUser.Image ?? null
    : null;
}

function mapApiPlaceReviewToModel(
  review: ApiPlaceReviewResponse,
  currentUser?: Pick<AppUsersModel, "Id" | "Image"> | null,
): PlaceReviewModel {
  return {
    Id: review.id,
    PlaceId: review.placeId,
    UserId: String(review.userId),
    UserName: review.userDisplayName,
    UserImage: getCurrentUserImageForReview(review, currentUser),
    Rating: review.rating,
    Comment: review.comment ?? "",
    CreatedAt: review.createdAt,
    UpdatedAt: review.updatedAt ?? null,
  };
}

export function buildPlaceReviewSummary(
  reviews: PlaceReviewModel[],
): PlaceReviewSummaryModel {
  if (reviews.length === 0) {
    return {
      AverageRating: null,
      ReviewsCount: 0,
    };
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.Rating, 0);

  return {
    AverageRating: Math.round((totalRating / reviews.length) * 10) / 10,
    ReviewsCount: reviews.length,
  };
}

export function formatPlaceReviewSummaryLabel(
  summary?: PlaceReviewSummaryModel | null,
) {
  if (!summary || summary.AverageRating === null || summary.ReviewsCount <= 0) {
    return null;
  }

  const reviewLabel = summary.ReviewsCount === 1 ? "review" : "reviews";
  return `${summary.AverageRating.toFixed(1)} (${summary.ReviewsCount} ${reviewLabel})`;
}

export async function fetchPlaceReviews(
  placeId: string,
  currentUser?: Pick<AppUsersModel, "Id" | "Image"> | null,
) {
  const collectedReviews: PlaceReviewModel[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await apiRequest<ApiPlaceReviewListResponse>(
      `/api/places/${placeId}/reviews?page=${page}&pageSize=${PLACE_REVIEWS_PAGE_SIZE}`,
    );

    collectedReviews.push(
      ...(response.items ?? []).map((review) =>
        mapApiPlaceReviewToModel(review, currentUser),
      ),
    );

    totalPages = Math.max(response.totalPages ?? 0, 1);
    page += 1;
  }

  return collectedReviews;
}

export async function savePlaceReview({
  placeId,
  rating,
  comment,
  reviewId,
  currentUser,
}: SavePlaceReviewInput) {
  const response = await apiRequest<ApiPlaceReviewResponse>(
    reviewId
      ? `/api/places/${placeId}/reviews/${reviewId}`
      : `/api/places/${placeId}/reviews`,
    {
      method: reviewId ? "PUT" : "POST",
      body: JSON.stringify({
        rating,
        comment: comment.trim() || null,
      }),
    },
  );

  return mapApiPlaceReviewToModel(response, currentUser);
}

export async function deletePlaceReview(placeId: string, reviewId: string) {
  await apiRequest(`/api/places/${placeId}/reviews/${reviewId}`, {
    method: "DELETE",
  });
}
