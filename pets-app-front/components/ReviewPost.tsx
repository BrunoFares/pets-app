import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { EvilIcons, Feather } from "@expo/vector-icons";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { AdaptiveText } from "./AdaptiveText";
import { AdaptiveView } from "./AdaptiveView";

const ReviewPost = ({ item }: { item: any }) => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { showFooter, setShowFooter } = useGlobal();

  return (
    <AdaptiveView style={styles.post}>
      <AdaptiveView style={{alignSelf: 'flex-start'}}>
        <TouchableOpacity>
          {item.photo ? (
            <Image source={item.photo} />
          ) : (
            <View style={styles.placeholder} />
          )}
        </TouchableOpacity>
      </AdaptiveView>

      <AdaptiveView>
        <TouchableOpacity>
          <AdaptiveText style={styles.postTitle}>{item.user}</AdaptiveText>
        </TouchableOpacity>

        <AdaptiveText style={styles.postContent}>{item.body}</AdaptiveText>
      </AdaptiveView>

      <AdaptiveView style={styles.additionalRow}>
        <TouchableOpacity>
          <EvilIcons
            name="comment"
            size={26}
            color={darkMode ? colors.white : colors.black}
          />
        </TouchableOpacity>

        <TouchableOpacity>
          <Feather
            name="share"
            size={18}
            color={darkMode ? colors.white : colors.black}
          />
        </TouchableOpacity>
      </AdaptiveView>
    </AdaptiveView>
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
      paddingHorizontal: 12,
      paddingVertical: 15,
      flexDirection: "row",
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderBottomWidth: 1,
        backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    postTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 18,
    },
    postContent: {
      fontFamily: "Poppins-Light",
      fontSize: 18,
      width: 274
    },
    additionalRow: {
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10
    },
  });
};

export default ReviewPost;
