import { AdaptiveText } from "@/components/AdaptiveText";
import ForumPost from "@/components/ForumPost";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { ForumPostsModel } from "@/data/models";
import { apiRequest } from "@/lib/api";
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
  Content: post.content ?? post.Content,
  Attachments: post.attachments ?? post.Attachments ?? [],
  CreatedAt: post.createdAt ?? post.CreatedAt,
  UpdatedAt: post.updatedAt ?? post.UpdatedAt ?? null,
  IsAReply: post.isAReply ?? post.IsAReply ?? false,
  ReplyingToPost: post.replyingToPost ?? post.ReplyingToPost ?? null,
  RepliesCount: post.repliesCount ?? post.RepliesCount,
  IsBookmarked: post.isBookmarked ?? post.IsBookmarked,
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
      setReplies([]);
      return;
    }

    if (!id) {
      setItem(undefined);
      setReplies([]);
      return;
    }

    const loadPost = async () => {
      try {
        const [post, postReplies] = await Promise.all([
          apiRequest<any>(`/api/ForumPosts/${id}`),
          apiRequest<any[]>(`/api/ForumPosts/${id}/replies`),
        ]);

        setItem(normalizeForumPost(post));
        setReplies(postReplies.map(normalizeForumPost));
      } catch {
        setItem(undefined);
        setReplies([]);
      }
    };

    loadPost();
  }, [id, payload]);

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <PageHeader title={item?.UserName ?? "Post"} />
        {item ? (
          <FlatList
            data={replies}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
            contentContainerStyle={{ alignSelf: "center", width: "100%" }}
            keyExtractor={(item) => String(item.Id)}
            ListHeaderComponent={<ForumPost size="big" item={item} />}
            renderItem={({ item }) => {
              if (replies && replies.length !== 0) {
                return <ForumPost size="small" item={item} />;
              } else {
                return <AdaptiveText>This post has no replies.</AdaptiveText>;
              }
            }}
            ListFooterComponent={<View style={{ height: 140 }} />}
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
