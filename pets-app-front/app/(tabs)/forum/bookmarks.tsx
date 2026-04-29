import ForumPost from "@/components/ForumPost";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import { colors } from "@/constants/colors";
import { ForumPostsModel } from "@/data/models";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { apiRequest } from "@/lib/api";
import { ApiForumPostResponse, normalizeForumPost } from "@/lib/forum-api";
import { applyRegisteredPlaceFlags, getRegisteredPlaceOwnerIds } from "@/lib/place-owner-lookup";
import { goTo } from "@/utils";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Keyboard,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Bookmarks() {
  const router = useRouter();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [posts, setPosts] = useState<ForumPostsModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookmarks = useCallback(async () => {
    setIsLoading(true);
    const avatarCacheKey = Date.now();

    try {
      const [forumPosts, ownerIds] = await Promise.all([
        apiRequest<ApiForumPostResponse[]>("/api/Users/bookmarks"),
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
      void loadBookmarks();
    }, [loadBookmarks]),
  );

  const { isRefreshing, onRefresh } = usePullToRefresh(loadBookmarks);
  const showLoadingOverlay = isLoading && !isRefreshing;

  const goToProfile = (item: ForumPostsModel) => {
    const payload = encodeURIComponent(JSON.stringify(item));

    router.push({
      pathname: "/(tabs)/forum/profile/[id]",
      params: {
        id: String(item.UserId || item.Id),
        payload,
      },
    });
  };

  const handleDeletedPost = useCallback((deletedPost: ForumPostsModel) => {
    setPosts((currentPosts) =>
      currentPosts.filter((post) => post.Id !== deletedPost.Id),
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <PageHeader title="" />

        <FlatList
          data={posts}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          contentContainerStyle={{ alignSelf: "center", width: "100%" }}
          keyExtractor={(item) => String(item.Id)}
          renderItem={({ item }) => {
            return (
              <ForumPost
                onClickPost={() => goTo(item, "/(tabs)/forum/post/[id]", router)}
                onClickProfile={() => goToProfile(item)}
                size="small"
                item={item}
                onDeleted={handleDeletedPost}
              />
            );
          }}
          ListEmptyComponent={
            isLoading ? null : (
              <ProfileEmptyState
                title="No bookmarked posts."
                subtitle="Go back to the forum and bookmark posts you want to keep for later!"
              />
            )
          }
          ListFooterComponent={<View style={{ height: 180 }} />}
        />
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
  });
};
