import { AdaptiveText } from "@/components/AdaptiveText";
import { colors } from "@/constants/colors";
import { PlaceModel } from "@/data/models";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export function getPlaceGalleryImageUrls(place: PlaceModel | null) {
  const urls: string[] = [];
  const seen = new Set<string>();

  const addUrl = (value?: string | null) => {
    const normalized = value?.trim();

    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    urls.push(normalized);
  };

  addUrl(place?.Photo);

  for (const image of place?.Images ?? []) {
    addUrl(image.Url);
  }

  return urls;
}

export default function PlaceImageGallery({
  imageUrls,
}: {
  imageUrls: string[];
}) {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const screenWidth = Dimensions.get("window").width;
  const galleryCardWidth = Math.min(screenWidth - 48, 360);
  const viewerWidth = screenWidth;
  const viewerScrollRef = useRef<ScrollView>(null);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (!isViewerVisible) {
      return;
    }

    requestAnimationFrame(() => {
      viewerScrollRef.current?.scrollTo({
        x: selectedImageIndex * viewerWidth,
        animated: false,
      });
    });
  }, [isViewerVisible, selectedImageIndex, viewerWidth]);

  useEffect(() => {
    if (selectedImageIndex >= imageUrls.length) {
      setSelectedImageIndex(Math.max(0, imageUrls.length - 1));
    }

    if (imageUrls.length === 0) {
      setIsViewerVisible(false);
    }
  }, [imageUrls.length, selectedImageIndex]);

  const selectedImageUrl = imageUrls[selectedImageIndex] ?? null;
  const galleryLabel = useMemo(() => {
    if (imageUrls.length === 1) {
      return "1 photo";
    }

    return `${imageUrls.length} photos`;
  }, [imageUrls.length]);

  const openViewer = (index: number) => {
    setSelectedImageIndex(index);
    setIsViewerVisible(true);
  };

  const closeViewer = () => {
    setIsViewerVisible(false);
  };

  if (imageUrls.length === 0) {
    return <View style={styles.imagePlaceholder} />;
  }

  return (
    <>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {imageUrls.map((url, index) => (
            <TouchableOpacity
              key={`${url}-${index}`}
              activeOpacity={0.92}
              onPress={() => openViewer(index)}
              style={[
                styles.galleryCard,
                {
                  width: galleryCardWidth,
                  marginRight: index === imageUrls.length - 1 ? 16 : 12,
                },
              ]}
            >
              <Image
                source={{ uri: url }}
                style={styles.galleryImage}
                contentFit="cover"
              />

              {index === 0 ? (
                <View style={styles.galleryBadge}>
                  <AdaptiveText style={styles.galleryBadgeText}>
                    {galleryLabel}
                  </AdaptiveText>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Modal
        visible={isViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={closeViewer}
      >
        <View style={styles.viewerOverlay}>
          <TouchableOpacity
            onPress={closeViewer}
            style={styles.viewerCloseButton}
          >
            <Ionicons name="close" size={22} color={colors.white} />
          </TouchableOpacity>

          {isViewerVisible && selectedImageUrl ? (
            <View style={styles.viewerCounter}>
              <AdaptiveText style={styles.viewerCounterText}>
                {selectedImageIndex + 1} / {imageUrls.length}
              </AdaptiveText>
            </View>
          ) : null}

          <ScrollView
            ref={viewerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onMomentumScrollEnd={(event) => {
              if (!isViewerVisible) {
                return;
              }

              const nextIndex = Math.round(
                event.nativeEvent.contentOffset.x / viewerWidth,
              );
              const boundedIndex = Math.max(
                0,
                Math.min(imageUrls.length - 1, nextIndex),
              );

              setSelectedImageIndex(boundedIndex);
            }}
          >
            {imageUrls.map((url, index) => (
              <View
                key={`${url}-viewer-${index}`}
                style={[styles.viewerPage, { width: viewerWidth }]}
              >
                <Image
                  source={{ uri: url }}
                  style={styles.viewerImage}
                  contentFit="contain"
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const createStyles = ({ darkMode }: any) =>
  StyleSheet.create({
    galleryCard: {
      height: 320,
      overflow: "hidden",
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      position: "relative",
    },
    galleryImage: {
      width: "100%",
      height: "100%",
    },
    galleryBadge: {
      position: "absolute",
      left: 14,
      bottom: 14,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: "rgba(0, 0, 0, 0.56)",
    },
    galleryBadgeText: {
      color: colors.white,
      fontFamily: "Poppins-Medium",
      fontSize: 13,
    },
    imagePlaceholder: {
      width: "100%",
      height: 320,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    viewerOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.92)",
      justifyContent: "center",
      alignItems: "center",
    },
    viewerCloseButton: {
      position: "absolute",
      top: 52,
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.14)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    viewerCounter: {
      position: "absolute",
      top: 58,
      alignSelf: "center",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: "rgba(255, 255, 255, 0)",
      zIndex: 1,
    },
    viewerCounterText: {
      color: colors.white,
      fontFamily: "Poppins-Medium",
      fontSize: 13,
    },
    viewerPage: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 32,
    },
    viewerImage: {
      width: "100%",
      height: "82%",
    },
  });
