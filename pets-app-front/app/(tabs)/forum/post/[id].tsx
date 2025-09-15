import { AdaptiveText } from "@/components/AdaptiveText";
import ForumPost from "@/components/ForumPost";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  useColorScheme,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PostScreen = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const router = useRouter();
  const { payload } = useLocalSearchParams<{ payload?: string }>();
  const chat: any = payload ? JSON.parse(decodeURIComponent(payload)) : null;
  const { showFooter, setShowFooter } = useGlobal();
  const [item, setItem] = useState<any>({
    key: 0,
    photo: "",
    username: "Abdo",
    body: "seen the state of her body (mad)",
  });
  const [liked, setLiked] = useState<boolean>();
  const [replies, setReplies] = useState([
    {
      key: 1,
      photo: "",
      username: "Kalinka",
      body: "firstPost badde tawlo shwe fa aam bektob zyede 3reft kif marhaba rayis kifak shu akhbarak meshe l7al kello tmm",
    },
    { key: 2, photo: "", username: "Bayyak", body: "secondPost" },
    {
      key: 3,
      photo: "",
      username: "Al Imamu Ali Bel Assad Bashar",
      body: "thirdPost",
    },
    { key: 4, photo: "", username: "Fadlallah Fares", body: "fourthPost" },
    { key: 5, photo: "", username: "Dr. Zhivago", body: "fifthPost" },
    { key: 6, photo: "", username: "Suce ma bite", body: "sixthPost" },
    { key: 7, photo: "", username: "Adrien Rabiot", body: "Beklo" },
    { key: 8, photo: "", username: "Hanane Baroud", body: "eighthPost" },
    { key: 9, photo: "", username: "Jean Pierres", body: "ninthPost" },
  ]);
  const [bookmarked, setBookmarked] = useState<boolean>();

  useFocusEffect(
    useCallback(() => {
      // This code runs when the screen is focused.
      console.log('Screen is focused!');

      return () => {
        // This code runs when the screen is unfocused (or unmounted).
        setShowFooter?.(true);
      };
    }, []) // The empty dependency array ensures the effect runs only on focus/unfocus.
  );

  const likePost = () => {
    setLiked(!liked);
  };

  const bookmarkPost = () => {
    setBookmarked(!bookmarked);
  };

  useEffect(() => {
    const displayItem = {
      key: 0,
      photo: "",
      username: "Abdo",
      body: "seen the state of her body (mad)",
    };
    const replies = [
      {
        key: 1,
        photo: "",
        username: "Kalinka",
        body: "firstPost badde tawlo shwe fa aam bektob zyede 3reft kif marhaba rayis kifak shu akhbarak meshe l7al kello tmm",
      },
      { key: 2, photo: "", username: "Bayyak", body: "secondPost" },
      {
        key: 3,
        photo: "",
        username: "Al Imamu Ali Bel Assad Bashar",
        body: "thirdPost",
      },
      { key: 4, photo: "", username: "Fadlallah Fares", body: "fourthPost" },
      { key: 5, photo: "", username: "Dr. Zhivago", body: "fifthPost" },
      { key: 6, photo: "", username: "Suce ma bite", body: "sixthPost" },
      { key: 7, photo: "", username: "Adrien Rabiot", body: "Beklo" },
      { key: 8, photo: "", username: "Hanane Baroud", body: "eighthPost" },
      { key: 9, photo: "", username: "Jean Pierres", body: "ninthPost" },
    ];

    setReplies(replies);
    setItem(displayItem);
  }, []);

  const goTo = (item: any, location: any) => {
    router.push({
      pathname: location,
      params: { id: String(item.key) },
    })
  }

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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View>
          <PageHeader
            title={chat && chat.title ? chat.title : "something else"}
          />
          {replies ? (
            <FlatList
              data={replies}
              contentContainerStyle={{ alignSelf: "center", width: "100%" }}
              keyExtractor={(item) => String(item.key)}
              ListHeaderComponent={
                <ForumPost 
                  onClickPost={() => goTo(item, "/(tabs)/forum/post/[id]")} 
                  onClickProfile={() => goTo(item, "/(tabs)/forum/profile/[id]")}
                  size='big' 
                  item={item} 
                />
              }
              renderItem={({ item }) => {
                return (
                  <ForumPost 
                    onClickPost={() => goTo(item, "/(tabs)/forum/post/[id]")} 
                    onClickProfile={() => goTo(item, "/(tabs)/forum/profile/[id]")}
                    size='small' 
                    item={item} 
                  />
                )
              }}
              ListFooterComponent={
                <View style={{ height: 140 }} />
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
