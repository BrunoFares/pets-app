import { AdaptiveText } from "@/components/AdaptiveText";
import MinimisedForumPost from "@/components/MinimisedForumPost";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { useHeaderSlide } from "@/hooks/useHeaderSlide";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Keyboard,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForumScreen() {
  const router = useRouter();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [posts, setPosts] = useState<any[]>([]);
  const { showFooter, setShowFooter } = useGlobal();

  useFocusEffect(
    useCallback(() => {
      // API all to get the Posts
      const forumPosts = [
        { key: 1, photo: "", username: "Kalinka", body: "firstPost badde tawlo shwe fa aam bektob zyede 3reft kif marhaba rayis kifak shu akhbarak meshe l7al kello tmm" },
        { key: 2, photo: "", username: "Bayyak", body: "secondPost" },
        { key: 3, photo: "", username: "Al Imamu Ali Bel Assad Bashar", body: "thirdPost" },
        { key: 4, photo: "", username: "Fadlallah Fares", body: "fourthPost" },
        { key: 5, photo: "", username: "Dr. Zhivago", body: "fifthPost" },
        { key: 6, photo: "", username: "Suce ma bite", body: "sixthPost" },
        { key: 7, photo: "", username: "Adrien Rabiot", body: "Beklo" },
        { key: 8, photo: "", username: "Hanane Baroud", body: "eighthPost" },
        { key: 9, photo: "", username: "Jean Pierres", body: "ninthPost" },
      ];
      setPosts(forumPosts);
    }, [])
  );

  const { translateY } = useHeaderSlide({ height: 200, duration: 250 });

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View>
          <Animated.View style={[styles.header, { transform: [{ translateY }] }]}>
              <TouchableOpacity>
                <Ionicons name="bookmark" size={24} color={darkMode ? colors.white : colors.black} />
              </TouchableOpacity>

              <Image
                source={require("@/assets/images/petsapp-logo-light.png")}
                style={{ height: 64, width: 64 }}
              />
              <TouchableOpacity>
                <FontAwesome
                  name="search"
                  size={24}
                  color={darkMode ? colors.white : colors.black}
                />
              </TouchableOpacity>
          </Animated.View>

          {posts ? (
            <FlatList
              data={posts}
              contentContainerStyle={{ alignSelf: "center", width: "100%" }}
              keyExtractor={(item) => String(item.key)}
              renderItem={({ item }) => {
                return (
                  <MinimisedForumPost item={item} />
                );
              }}
              ListFooterComponent={
                <View style={{ height: 180 }} />
              }
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
      </TouchableWithoutFeedback>
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
