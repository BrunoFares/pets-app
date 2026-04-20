import { AdaptiveText } from "@/components/AdaptiveText";
import ForumPost from "@/components/ForumPost";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { ForumPostsModel } from "@/data/models";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { apiRequest, resolveApiUrl } from "@/lib/api";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const normalizeForumPost = (post: any): ForumPostsModel => ({
  Id: post.id ?? post.Id,
  UserId: post.userId ?? post.UserId,
  UserName: post.userName ?? post.UserName,
  UserImage: resolveApiUrl(post.userImage ?? post.UserImage ?? null),
  Content: post.content ?? post.Content,
  Attachments: post.attachments ?? post.Attachments ?? [],
  CreatedAt: post.createdAt ?? post.CreatedAt,
  UpdatedAt: post.updatedAt ?? post.UpdatedAt ?? null,
  IsAReply: post.isAReply ?? post.IsAReply ?? false,
  ReplyingToPost: post.replyingToPost ?? post.ReplyingToPost ?? null,
  RepliesCount: post.repliesCount ?? post.RepliesCount,
  IsBookmarked: post.isBookmarked ?? post.IsBookmarked,
  LikesCount: post.likesCount ?? post.LikesCount ?? 0,
  IsLikedByCurrentUser:
    post.isLikedByCurrentUser ?? post.IsLikedByCurrentUser ?? false,
});

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

    try {
      const [post, postReplies] = await Promise.all([
        apiRequest<any>(`/api/ForumPosts/${postId}`),
        apiRequest<any[]>(`/api/ForumPosts/${postId}/replies`),
      ]);

      setItem(normalizeForumPost(post));
      setReplies(postReplies.map(normalizeForumPost));
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
      try {
        selectedPost = normalizeForumPost(JSON.parse(decodeURIComponent(payload)));
      } catch {
        try {
          selectedPost = normalizeForumPost(JSON.parse(payload));
        } catch {
          selectedPost = null;
        }
      }
    }

    if (selectedPost) {
      setItem(selectedPost);
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
          renderItem={({ item }) => <ForumPost size="small" item={item} />}
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
