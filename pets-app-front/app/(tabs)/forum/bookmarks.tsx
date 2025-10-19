import { AdaptiveText } from "@/components/AdaptiveText";
import ForumPost from "@/components/ForumPost";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { ForumPostsModel } from "@/data/models";
import { ForumPosts } from "@/data/sample";
import { useHeaderSlide } from "@/hooks/useHeaderSlide";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  useColorScheme,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Bookmarks() {
  const router = useRouter();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [posts, setPosts] = useState<ForumPostsModel[]>([]);
  const { showFooter, setShowFooter } = useGlobal();

  useFocusEffect(
    useCallback(() => {
      // API all to get the Posts
      const forumPosts = ForumPosts;
      setPosts(forumPosts);
    }, [])
  );

  const goTo = (item: ForumPostsModel, location: any) => {
    router.push({
      pathname: location,
      params: { id: String(item.Id) },
    })
  }

  const { translateY } = useHeaderSlide({ height: 200, duration: 250 });

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={{backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,}}>
        <View>
          <PageHeader title="Bookmarks" />

          {posts ? (
            <FlatList
              data={posts}
              contentContainerStyle={{ alignSelf: "center", width: "100%" }}
              keyExtractor={(item) => String(item.Id)}
              renderItem={({ item }) => {
                return (
                  <ForumPost 
                    onClickPost={() => goTo(item, "/(tabs)/forum/post/[id]")} 
                    onClickProfile={() => goTo(item, "/(tabs)/forum/profile/[id]")}
                    size='small' 
                    item={item} 
                  />
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
