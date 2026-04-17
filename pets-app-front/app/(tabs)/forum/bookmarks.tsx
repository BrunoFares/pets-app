import { AdaptiveText } from "@/components/AdaptiveText";
import ForumPost from "@/components/ForumPost";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { ForumPostsModel } from "@/data/models";
import { apiRequest } from "@/lib/api";
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

  useFocusEffect(
    useCallback(() => {
      const loadBookmarks = async () => {
        try {
          const forumPosts = await apiRequest<{
            id: string;
            content: string;
            createdAt: string;
            userName: string;
          }[]>("/api/Users/bookmarks");

          setPosts(
            forumPosts.map((post) => ({
              Id: post.id,
              UserId: "",
              UserName: post.userName,
              Content: post.content,
              Attachments: [],
              CreatedAt: post.createdAt,
              IsAReply: false,
              ReplyingToPost: null,
              IsBookmarked: true,
              RepliesCount: 0,
            })),
          );
        } catch {
          setPosts([]);
        }
      };

      loadBookmarks();
    }, [])
  );

  const goTo = (item: ForumPostsModel, location: any) => {
    router.push({
      pathname: location,
      params: { id: String(item.Id) },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <PageHeader title="Bookmarks" />

        {posts ? (
          <FlatList
            data={posts}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
            contentContainerStyle={{ alignSelf: "center", width: "100%" }}
            keyExtractor={(item) => String(item.Id)}
            renderItem={({ item }) => {
              return (
                <ForumPost
                  onClickPost={() => goTo(item, "/(tabs)/forum/post/[id]")}
                  onClickProfile={() => goTo(item, "/(tabs)/forum/profile/[id]")}
                  size="small"
                  item={item}
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
