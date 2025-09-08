import { colors } from "@/constants/colors";
import { AntDesign, EvilIcons, Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { AdaptiveText } from "./AdaptiveText";
import { AdaptiveView } from "./AdaptiveView";

const MinimisedForumPost = ({ item }: any) => {
  const darkMode = useColorScheme() === "dark";
  const router = useRouter();
  const styles = createStyles({ darkMode });
  const [liked, setLiked] = useState<boolean>();
  const [bookmarked, setBookmarked] = useState<boolean>();

  const likePost = () => {
    setLiked(!liked);
  }

  const bookmarkPost = () => {
    setBookmarked(!bookmarked);
  }

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/(tabs)/forum/[id]",
          params: { id: String(item.key) },
        })
      }
      style={styles.post}
    >
      <AdaptiveView style={{flexDirection: "row"}}>
        <TouchableOpacity>
          {item.photo ? (
            <Image source={item.photo} />
          ) : (
            <View style={styles.placeholder} />
          )}
        </TouchableOpacity>

        <AdaptiveView>
          <TouchableOpacity>
            <AdaptiveText style={styles.postTitle}>
              {item.username}
            </AdaptiveText>
          </TouchableOpacity>

          <AdaptiveText style={styles.postContent}>{item.body}</AdaptiveText>
        </AdaptiveView>
      </AdaptiveView>

      <AdaptiveView style={styles.additionalRow}>
        <TouchableOpacity>
          <EvilIcons name="comment" size={26} color={darkMode ? colors.white : colors.black} />
        </TouchableOpacity>

        <TouchableOpacity onPress={likePost}>
          {liked ? 
            <AntDesign name="heart" size={18} color={colors.green} />
          :
            <AntDesign name="hearto" size={18} color={darkMode ? colors.white : colors.black} />
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={bookmarkPost}>
          {bookmarked ? 
            <Ionicons name="bookmark" size={18} color={colors.green} />
          :
            <Ionicons name="bookmark-outline" size={18} color={darkMode ? colors.white : colors.black} />
          }
        </TouchableOpacity>

        <TouchableOpacity>
          <Feather name="share" size={18} color={darkMode ? colors.white : colors.black} />
        </TouchableOpacity>
      </AdaptiveView>
    </TouchableOpacity>
  );
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
    additionalRow: {
      flexDirection: 'row', 
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10
    }
  });
};

export default MinimisedForumPost;
