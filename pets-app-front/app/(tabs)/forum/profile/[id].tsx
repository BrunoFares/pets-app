import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import ForumPost from "@/components/ForumPost";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfileScreen = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [user, setUser] = useState({ photo: "" });

  const labels = ["Posts", "Posts & Replies"];
  const { width } = useWindowDimensions();
  const tabWidth = width / labels.length;

  const [index, setIndex] = useState(0);
  const scrollRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [posts, setPosts] = useState([
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

  const goTo = (i: number) => {
    setIndex(i);
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="" />
      <ScrollView>
        <AdaptiveView style={styles.header}>
          {user && user.photo ? (
            <Image source={user.photo} />
          ) : (
            <View style={styles.placeholder} />
          )}

          <AdaptiveText
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 20,
            }}
          >
            Kalinka
          </AdaptiveText>
        </AdaptiveView>

        <AdaptiveText
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 14,
            marginHorizontal: 20,
            marginVertical: 10,
          }}
        >
          Description description description description description
          description description description
        </AdaptiveText>

        {/* Header area (sliding) */}
        <View style={styles.tabs}>
          {labels.map((label, i) => (
            <Pressable
              key={label}
              onPress={() => goTo(i)}
              accessibilityRole="tab"
              accessibilityState={{ selected: index === i }}
              style={styles.tabBtn}
            >
              <Text style={[styles.text, index === i && styles.textActive]}>
                {label}
              </Text>
            </Pressable>
          ))}

          {/* Indicator */}
          <Animated.View
            style={[
              styles.indicator,
              {
                width: tabWidth,
                transform: [
                  {
                    translateX: Animated.multiply(scrollX, tabWidth / width),
                  },
                ],
              },
            ]}
          />
        </View>

        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            setIndex(i);
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
        >
          <View style={[styles.page, { width }]}>
            <FlatList
              data={posts}
              scrollEnabled={false}
              keyExtractor={(item) => String(item.key)}
              renderItem={({ item }) => {
                return (
                  <ForumPost
                    size="small"
                    onClickPost={() => {}}
                    onClickProfile={() => {}}
                    item={item}
                  />
                );
              }}
            />
          </View>

          <View style={[styles.page, { width }]}>
            <FlatList
              data={posts}
              scrollEnabled={false}
              keyExtractor={(item) => String(item.key)}
              contentContainerStyle={{ width: 370 }}
              renderItem={({ item }) => {
                return (
                  <ForumPost
                    size="small"
                    onClickPost={() => {}}
                    onClickProfile={() => {}}
                    item={item}
                  />
                );
              }}
            />

            {/* {posts && 
            posts.map(item => {
              return (
                <ForumPost
                    size="small"
                    onClickPost={() => {}}
                    onClickProfile={() => {}}
                    item={item}
                  />
              )
            })
            } */}
          </View>
        </Animated.ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    header: {
      flexDirection: "row",
      paddingHorizontal: 20,
      alignItems: "center",
      gap: 20,
    },
    placeholder: {
      backgroundColor: colors.lightGrey,
      borderRadius: 70,
      width: 70,
      height: 70,
    },
    page: {
      flex: 1,
    },

    // --- tabs ---
    tabs: {
      flexDirection: "row",
      alignSelf: "center",
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      gap: 14,
      paddingHorizontal: 16,
      height: 50,
      paddingVertical: 10,
      overflow: "hidden", // keeps indicator rounded
      position: "relative",
    },
    tabBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 6,
      minWidth: 80,
    },
    text: {
      color: darkMode ? colors.white : colors.black,
      fontSize: 14,
      fontWeight: "600",
      fontFamily: "Poppins-Medium",
    },
    textActive: {
      opacity: 1,
    },
    indicator: {
      position: "absolute",
      bottom: 0,
      height: 2,
      backgroundColor: darkMode ? colors.white : colors.black,
    },
  });
};
