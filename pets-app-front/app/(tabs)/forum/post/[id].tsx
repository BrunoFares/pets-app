import { AdaptiveText } from "@/components/AdaptiveText";
import ForumPost from "@/components/ForumPost";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { ForumPostsModel } from "@/data/models";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { apiRequest } from "@/lib/api";
import { ApiForumPostResponse, normalizeForumPost } from "@/lib/forum-api";
import {
  applyRegisteredPlaceFlag,
  applyRegisteredPlaceFlags,
  getRegisteredPlaceOwnerIds,
} from "@/lib/place-owner-lookup";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PostScreen = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { id, payload } = useLocalSearchParams<{
    id?: string;
    payload?: string;
  }>();
  const { setShowFooter } = useGlobal();
  const [item, setItem] = useState<ForumPostsModel>();
  const [replies, setReplies] = useState<ForumPostsModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPost = useCallback(async (postId: string) => {
    setIsLoading(true);
    const avatarCacheKey = Date.now();

    try {
      const [post, postReplies, ownerIds] = await Promise.all([
        apiRequest<ApiForumPostResponse>(`/api/ForumPosts/${postId}`),
        apiRequest<ApiForumPostResponse[]>(`/api/ForumPosts/${postId}/replies`),
        getRegisteredPlaceOwnerIds(),
      ]);

      setItem(
        applyRegisteredPlaceFlag(
          normalizeForumPost(post, avatarCacheKey),
          ownerIds,
        ),
      );
      setReplies(
        applyRegisteredPlaceFlags(
          postReplies.map((reply) => normalizeForumPost(reply, avatarCacheKey)),
          ownerIds,
        ),
      );
    } catch {
      setItem(undefined);
      setReplies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        // This code runs when the screen is unfocused (or unmounted).
        setShowFooter?.(true);
      };
    }, [setShowFooter]),
  );

  useEffect(() => {
    let selectedPost: ForumPostsModel | null = null;

    if (payload) {
      const avatarCacheKey = Date.now();
      try {
        selectedPost = normalizeForumPost(
          JSON.parse(decodeURIComponent(payload)) as ApiForumPostResponse,
          avatarCacheKey,
        );
      } catch {
        try {
          selectedPost = normalizeForumPost(
            JSON.parse(payload) as ApiForumPostResponse,
            avatarCacheKey,
          );
        } catch {
          selectedPost = null;
        }
      }
    }

    if (selectedPost) {
      void getRegisteredPlaceOwnerIds()
        .then((ownerIds) => {
          setItem(applyRegisteredPlaceFlag(selectedPost, ownerIds));
        })
        .catch(() => {
          setItem(selectedPost);
        });
    }

    if (!id) {
      if (!selectedPost) {
        setItem(undefined);
        setReplies([]);
        setIsLoading(false);
      }
      return;
    }

    void loadPost(id);
  }, [id, loadPost, payload]);

  const handleReplySubmitted = useCallback(async () => {
    if (!id) {
      return;
    }

    await loadPost(id);
  }, [id, loadPost]);

  const handleDeletedPost = useCallback(
    async (deletedPost: ForumPostsModel) => {
      if (item && deletedPost.Id === item.Id) {
        router.back();
        return;
      }

      setReplies((currentReplies) =>
        currentReplies.filter((reply) => reply.Id !== deletedPost.Id),
      );

      if (
        item &&
        deletedPost.IsAReply &&
        deletedPost.ReplyingToPost &&
        String(deletedPost.ReplyingToPost) === String(item.Id)
      ) {
        setItem((currentItem) =>
          currentItem
            ? {
                ...currentItem,
                RepliesCount: Math.max(0, (currentItem.RepliesCount ?? 0) - 1),
              }
            : currentItem,
        );
      }
    },
    [item],
  );

  const { isRefreshing, onRefresh } = usePullToRefresh(
    useCallback(async () => {
      if (id) {
        await loadPost(id);
      }
    }, [id, loadPost]),
  );
  const showLoadingOverlay = isLoading && !isRefreshing;

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <PageHeader title={item?.UserName ?? "Post"} />
        <FlatList
          data={item ? replies : []}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          contentContainerStyle={{ alignSelf: "center", width: "100%", flexGrow: 1 }}
          keyExtractor={(item) => String(item.Id)}
          ListHeaderComponent={
            item ? (
              <ForumPost
                size="big"
                item={item}
                onReplySubmitted={handleReplySubmitted}
                onDeleted={handleDeletedPost}
              />
            ) : null
          }
          ListEmptyComponent={
            isLoading ? null : item ? (
              <AdaptiveText
                style={{
                  alignSelf: "center",
                  fontFamily: "Poppins-SemiBold",
                  marginTop: 40,
                }}
              >
                This post has no replies.
              </AdaptiveText>
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
            )
          }
          renderItem={({ item }) => (
            <ForumPost
              size="small"
              item={item}
              onDeleted={handleDeletedPost}
            />
          )}
          ListFooterComponent={<View style={{ height: 140 }} />}
        />
      </View>

      {showLoadingOverlay && <LoadingOverlay />}
    </SafeAreaView>
  );
};

export default PostScreen;

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    postTitle: {
      marginLeft: 10,
      fontFamily: "Poppins-Bold",
      fontSize: 22,
    },
    postBody: {
      fontFamily: "Poppins-Regular",
      fontSize: 20,
    },
    placeholder: {
      backgroundColor: colors.lightGrey,
      borderRadius: 52,
      width: 52,
      height: 52,
    },
    additionalRow: {
      borderTopColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderTopWidth: 1,
      borderBottomColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderBottomWidth: 1,
      paddingHorizontal: 20,
      paddingVertical: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 20,
    },
    textInputContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      borderBottomColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderBottomWidth: 1,
    },
    textInput: {
      width: "80%",
      fontFamily: "Poppins-Regular",
      fontSize: 18,
      paddingVertical: 20,
      color: darkMode ? colors.white : colors.black,
    },
  });
};
