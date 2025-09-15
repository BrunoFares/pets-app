import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { AntDesign, EvilIcons, Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { AdaptiveText } from "./AdaptiveText";
import { AdaptiveView } from "./AdaptiveView";

const ForumPost = ({ 
  item, 
  size,
  onClickPost,
  onClickProfile
} : {
  item: any; 
  size?: 'big' | 'small';
  onClickPost: () => void;
  onClickProfile: () => void;
}) => {
  const darkMode = useColorScheme() === "dark";
  const router = useRouter();
  const styles = createStyles({ darkMode });
  const [liked, setLiked] = useState<boolean>();
  const [bookmarked, setBookmarked] = useState<boolean>();
  const { showFooter, setShowFooter } = useGlobal();

  const likePost = () => {
    setLiked(!liked);
  };

  const bookmarkPost = () => {
    setBookmarked(!bookmarked);
  };

  if (size === "small") {
    return (
      <TouchableOpacity
        onPress={() => onClickPost()}
        style={styles.post}
      >
        <AdaptiveView style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => onClickProfile()}>
            {item.photo ? (
              <Image source={item.photo} />
            ) : (
              <View style={styles.placeholder} />
            )}
          </TouchableOpacity>

          <AdaptiveView>
            <TouchableOpacity onPress={() => onClickProfile()}>
              <AdaptiveText style={styles.postTitle}>
                {item.username}
              </AdaptiveText>
            </TouchableOpacity>

            <AdaptiveText style={styles.postContent}>{item.body}</AdaptiveText>
          </AdaptiveView>
        </AdaptiveView>

        <AdaptiveView style={styles.additionalRowSmall}>
          <TouchableOpacity>
            <EvilIcons
              name="comment"
              size={26}
              color={darkMode ? colors.white : colors.black}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={likePost}>
            {liked ? (
              <AntDesign name="heart" size={18} color={colors.green} />
            ) : (
              <AntDesign
                name="hearto"
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
  } else {
    return (
      <>
        <AdaptiveView style={{ marginHorizontal: 20 }}>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 16,
              alignSelf: "flex-start"
            }}
            onPress={() => onClickProfile()}
          >
            {item && item.photo ? (
              <Image source={item.photo} />
            ) : (
              <View style={styles.placeholder} />
            )}
            <AdaptiveText style={styles.postTitle}>
              {item.username}
            </AdaptiveText>
          </TouchableOpacity>
          <AdaptiveText style={styles.postBody}>{item.body}</AdaptiveText>
        </AdaptiveView>

        <AdaptiveView style={styles.additionalRowBig}>
          <TouchableOpacity>
            <EvilIcons
              name="comment"
              size={26}
              color={darkMode ? colors.white : colors.black}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={likePost}>
            {liked ? (
              <AntDesign name="heart" size={18} color={colors.green} />
            ) : (
              <AntDesign
                name="hearto"
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

        <AdaptiveView style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Reply to user1..."
            placeholderTextColor={darkMode ? colors.lightGrey : colors.darkGrey}
            onFocus={() => setShowFooter?.(false)}
            onBlur={() => setShowFooter?.(true)}
            multiline
          />
          <AntDesign
            name="arrowright"
            size={24}
            color={darkMode ? colors.white : colors.black}
          />
        </AdaptiveView>
      </>
    );
  }
};

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    placeholder: {
      backgroundColor: colors.lightGrey,
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
  });
};

export default ForumPost;
