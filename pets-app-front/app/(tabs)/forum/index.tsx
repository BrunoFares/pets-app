import { AdaptiveText } from "@/components/AdaptiveText";
import ForumPost from "@/components/ForumPost";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { ForumPostsModel } from "@/data/models";
import { useHeaderSlide } from "@/hooks/useHeaderSlide";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { apiRequest } from "@/lib/api";
import { ApiForumPostResponse, normalizeForumPost } from "@/lib/forum-api";
import { applyRegisteredPlaceFlags, getRegisteredPlaceOwnerIds } from "@/lib/place-owner-lookup";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForumScreen() {
  const router = useRouter();
  const { openProfileId, openProfileToken } = useLocalSearchParams<{
    openProfileId?: string;
    openProfileToken?: string;
  }>();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [posts, setPosts] = useState<ForumPostsModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setShowFooter } = useGlobal();
  const handledOpenProfileTokenRef = useRef<string | null>(null);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    const avatarCacheKey = Date.now();

    try {
      const [forumPosts, ownerIds] = await Promise.all([
        apiRequest<ApiForumPostResponse[]>("/api/ForumPosts"),
        getRegisteredPlaceOwnerIds(),
      ]);

      setPosts(
        applyRegisteredPlaceFlags(
          forumPosts.map((post) => normalizeForumPost(post, avatarCacheKey)),
          ownerIds,
        ),
      );
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPosts();
    }, [loadPosts]),
  );

  useEffect(() => {
    if (!openProfileId || !openProfileToken) {
      return;
    }

    if (handledOpenProfileTokenRef.current === openProfileToken) {
      return;
    }

    handledOpenProfileTokenRef.current = openProfileToken;

    router.push({
      pathname: "/(tabs)/forum/profile/[id]",
      params: { id: String(openProfileId) },
    });
  }, [openProfileId, openProfileToken, router]);

  const { isRefreshing, onRefresh } = usePullToRefresh(loadPosts);
  const showLoadingOverlay = isLoading && !isRefreshing;

  const handleDeletedPost = useCallback((deletedPost: ForumPostsModel) => {
    setPosts((currentPosts) =>
      currentPosts.filter((post) => post.Id !== deletedPost.Id),
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        // This code runs when the screen is unfocused (or unmounted).
        setShowFooter?.(true);
      };
    }, [setShowFooter]), // The empty dependency array ensures the effect runs only on focus/unfocus.
  );

  const { translateY } = useHeaderSlide({ height: 200, duration: 250 });

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Animated.View style={[styles.header, { transform: [{ translateY }] }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push("/(tabs)/forum/bookmarks")}
          >
            <Ionicons
              name="bookmark"
              size={24}
              color={darkMode ? colors.white : colors.black}
            />
          </TouchableOpacity>

          <Image
            source={require("@/assets/images/petsapp-logo-light.png")}
            style={{ height: 64, width: 64 }}
          />
          <TouchableOpacity
            style={[
              styles.headerButton,
              {
                backgroundColor: colors.green,
                borderRadius: 16,
                width: 40,
                height: 40,
              },
            ]}
            onPress={() => router.push("/(tabs)/forum/create")}
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>

        {posts ? (
          <FlatList
            data={posts}
            refreshing={isRefreshing}
            style={{ marginBottom: 20 }}
            onRefresh={onRefresh}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
            contentContainerStyle={{ alignSelf: "center", width: "100%" }}
            keyExtractor={(item) => String(item.Id)}
            renderItem={({ item }) => {
              return (
                <ForumPost
                  size="small"
                  item={item}
                  onDeleted={handleDeletedPost}
                />
              );
            }}
            ListFooterComponent={<View style={{ height: 180 }} />}
          />
        ) : (
          <AdaptiveText
            style={{
              alignSelf: "center",
              fontFamily: "Poppins-SemiBold",
              marginTop: 250,
            }}
          >
            No items found.
          </AdaptiveText>
        )}
      </View>

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
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      alignSelf: "center",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderBottomColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderBottomWidth: 1,
    },
    headerButton: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },
  });
};
