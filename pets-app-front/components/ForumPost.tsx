import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { ForumPostsModel } from "@/data/models";
import { apiRequest } from "@/lib/api";
import { EvilIcons, Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { goTo } from "../utils";
import { AdaptiveText } from "./AdaptiveText";
import { AdaptiveView } from "./AdaptiveView";
import CustomImage from "./CustomImage";

const ForumPost = ({
  item,
  size,
  onClickPost,
  onClickProfile,
}: {
  item: ForumPostsModel;
  size?: "big" | "small";
  onClickPost?: () => void;
  onClickProfile?: () => void;
}) => {
  const darkMode = useColorScheme() === "dark";
  const router = useRouter();
  const styles = createStyles({ darkMode });
  const [liked, setLiked] = useState<boolean>();
  const [bookmarked, setBookmarked] = useState<boolean>(
    item.IsBookmarked ?? false,
  );
  const { setShowFooter } = useGlobal();
  const handlePostPress =
    onClickPost ?? (() => goTo(item, "/(tabs)/forum/post/[id]", router));
  const handleProfilePress =
    onClickProfile ?? (() => goTo(item, "/(tabs)/forum/profile/[id]", router));

  const syncBookmark = async (nextBookmarked: boolean) => {
    if (nextBookmarked) {
      await apiRequest("/api/Users/bookmarks", {
        method: "POST",
        body: JSON.stringify({ forumPostId: item.Id }),
      });
      return;
    }

    await apiRequest(`/api/Users/bookmarks/${item.Id}`, {
      method: "DELETE",
    });
  };

  const likePost = async () => {
    setLiked(true);
  };

  const bookmarkPost = async () => {
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);

    try {
      await syncBookmark(nextBookmarked);
    } catch (error) {
      setBookmarked(!nextBookmarked);
      console.error("Failed to update bookmark status.", error);
    }
  };

  if (size === "small") {
    return (
      <TouchableOpacity onPress={handlePostPress} style={styles.post}>
        <AdaptiveView style={[styles.inner, { flexDirection: "row" }]}>
          <TouchableOpacity onPress={handleProfilePress}>
            {/* {user.Image ? (
              <Image source={user.Image} />
            ) : (
              <View style={styles.placeholder} />
            )} */}
            <CustomImage customStyles={styles.placeholder} />
          </TouchableOpacity>

          <AdaptiveView style={styles.inner}>
            <TouchableOpacity onPress={handleProfilePress}>
              <AdaptiveText style={styles.postTitle}>
                {item.UserName}
              </AdaptiveText>
            </TouchableOpacity>

            {item.IsAReply && (
              <TouchableOpacity style={styles.reply} onPress={handlePostPress}>
                <AdaptiveText style={styles.replyTxt}>
                  Replying to another post
                </AdaptiveText>
              </TouchableOpacity>
            )}

            <AdaptiveText style={styles.postContent}>
              {item.Content}
            </AdaptiveText>
          </AdaptiveView>
        </AdaptiveView>

        <AdaptiveView style={[styles.inner, styles.additionalRowSmall]}>
          <TouchableOpacity>
            <EvilIcons
              name="comment"
              size={26}
              color={darkMode ? colors.white : colors.black}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={likePost}>
            {liked ? (
              <Ionicons name="heart-sharp" size={18} color={colors.green} />
            ) : (
              <Ionicons
                name="heart-outline"
                size={18}
                color={darkMode ? colors.white : colors.black}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={bookmarkPost}>
            {bookmarked ? (
              <Ionicons name="bookmark" size={18} color={colors.green} />
            ) : (
              <Ionicons
                name="bookmark-outline"
                size={18}
                color={darkMode ? colors.white : colors.black}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity>
            <Feather
              name="share"
              size={18}
              color={darkMode ? colors.white : colors.black}
            />
          </TouchableOpacity>
        </AdaptiveView>
      </TouchableOpacity>
    );
  } else if (size === "big") {
    return (
      <>
        <View style={{ marginHorizontal: 20 }}>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 16,
              alignSelf: "flex-start",
            }}
            onPress={() => goTo(item, "/(tabs)/forum/profile/[id]", router)}
          >
            <CustomImage customStyles={styles.placeholder} />
            <AdaptiveText style={styles.postTitle}>
              {item.UserName}
            </AdaptiveText>
          </TouchableOpacity>
          <AdaptiveText style={styles.postBody}>{item.Content}</AdaptiveText>
        </View>

        <View style={styles.additionalRowBig}>
          <TouchableOpacity>
            <EvilIcons
              name="comment"
              size={26}
              color={darkMode ? colors.white : colors.black}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={likePost}>
            {liked ? (
              <Ionicons name="heart-sharp" size={18} color={colors.green} />
            ) : (
              <Ionicons
                name="heart-outline"
                size={18}
                color={darkMode ? colors.white : colors.black}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={bookmarkPost}>
            {bookmarked ? (
              <Ionicons name="bookmark" size={18} color={colors.green} />
            ) : (
              <Ionicons
                name="bookmark-outline"
                size={18}
                color={darkMode ? colors.white : colors.black}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity>
            <Feather
              name="share"
              size={18}
              color={darkMode ? colors.white : colors.black}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Reply to user1..."
            placeholderTextColor={darkMode ? colors.lightGrey : colors.darkGrey}
            onFocus={() => setShowFooter?.(false)}
            onBlur={() => setShowFooter?.(true)}
            multiline
          />
          <Feather
            name="arrow-right"
            size={24}
            color={darkMode ? colors.white : colors.black}
          />
        </View>
      </>
    );
  } else {
    return <AdaptiveText>Post unavailable.</AdaptiveText>;
  }
};

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    placeholder: {
      borderRadius: 52,
      width: 52,
      height: 52,
    },
    post: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderBottomWidth: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    inner: {
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    postTitle: {
      fontFamily: "Poppins-SemiBold",
      marginLeft: 10,
      fontSize: 18,
    },
    postContent: {
      fontFamily: "Poppins-Light",
      marginLeft: 10,
      fontSize: 18,
      width: 300,
    },
    additionalRowSmall: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
    },
    additionalRowBig: {
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
    postBody: {
      fontFamily: "Poppins-Regular",
      fontSize: 20,
    },
    reply: {
      marginLeft: 10,
    },
    replyTxt: {
      fontFamily: "Poppins-Medium",
      fontSize: 12,
      color: colors.green,
    },
  });
};

export default ForumPost;
