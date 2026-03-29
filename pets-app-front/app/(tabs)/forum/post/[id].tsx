import { AdaptiveText } from "@/components/AdaptiveText";
import ForumPost from "@/components/ForumPost";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { ForumPostsModel } from "@/data/models";
import { ForumPosts } from "@/data/sample";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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
  const router = useRouter();
  const { payload } = useLocalSearchParams<{ payload: string }>();
  const chat: any = payload ? JSON.parse(decodeURIComponent(payload)) : null;
  const { showFooter, setShowFooter } = useGlobal();
  const [item, setItem] = useState<ForumPostsModel>();
  const [liked, setLiked] = useState<boolean>();
  const [replies, setReplies] = useState<ForumPostsModel[]>();
  const [bookmarked, setBookmarked] = useState<boolean>();

  useFocusEffect(
    useCallback(() => {
      return () => {
        // This code runs when the screen is unfocused (or unmounted).
        setShowFooter?.(true);
      };
    }, [])
  );

  const likePost = () => {
    setLiked(!liked);
  };

  const bookmarkPost = () => {
    setBookmarked(!bookmarked);
  };

  useEffect(() => {
    const displayItem = JSON.parse(payload);
    const replies = ForumPosts.filter(item => item.ReplyingToPost === displayItem.Id);

    setReplies(replies);
    setItem(displayItem);
  }, []);

  useFocusEffect(
    useCallback(() => {
      // This code runs when the screen is focused.

      return () => {
        // This code runs when the screen is unfocused (or unmounted).
        setShowFooter?.(true);
      };
    }, []) // The empty dependency array ensures the effect runs only on focus/unfocus.
  );

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <PageHeader title={chat && chat.title ? chat.title : "something else"} />
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
      width: '80%', 
      fontFamily: "Poppins-Regular",
      fontSize: 18,
      paddingVertical: 20,
      color: darkMode ? colors.white : colors.black,
    },
  });
};
