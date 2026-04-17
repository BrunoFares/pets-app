import { AdaptiveText } from "@/components/AdaptiveText";
import CustomImage from "@/components/CustomImage";
import ForumPost from "@/components/ForumPost";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { AppUsersModel, ForumPostsModel } from "@/data/models";
import { apiRequest } from "@/lib/api";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
  const { payload } = useLocalSearchParams<{ payload?: any }>();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [user, setUser] = useState<AppUsersModel>();

  const labels = ["Posts", "Posts & Replies"];
  const { width } = useWindowDimensions();
  const tabWidth = width / labels.length;

  const [index, setIndex] = useState(0);
  const scrollRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [posts, setPosts] = useState<ForumPostsModel[]>();
  const [replies, setReplies] = useState<ForumPostsModel[]>();

  useEffect(() => {
    const selectedPost = payload
      ? JSON.parse(decodeURIComponent(payload))
      : null;
    const selectedUserID = selectedPost?.UserId;

    if (!selectedUserID) {
      setUser(undefined);
      setPosts([]);
      setReplies([]);
      return;
    }

    const loadPosts = async () => {
      try {
        const allPosts = await apiRequest<any[]>("/api/ForumPosts");
        const normalizedPosts = allPosts.map((item) => ({
          Id: item.id,
          UserId: item.userId,
          UserName: item.userName,
          Content: item.content,
          Attachments: item.attachments ?? [],
          CreatedAt: item.createdAt,
          UpdatedAt: item.updatedAt ?? null,
          IsAReply: item.isAReply,
          ReplyingToPost: item.replyingToPost ?? null,
          RepliesCount: item.repliesCount,
          IsBookmarked: item.isBookmarked,
        }));

        const displayPosts = normalizedPosts.filter(
          (item) => String(item.UserId) === String(selectedUserID),
        );

        setUser({
          Id: selectedUserID,
          Name: selectedPost?.UserName ?? "User",
          FirstName: "",
          LastName: "",
          Email: "",
          PhoneNumber: "",
          PasswordHash: "",
          Image: "",
          CreatedAt: "",
          LastLogin: null,
          Description: "",
          BookmarkedPostID: [],
        });
        setPosts(displayPosts.filter((item) => !item.IsAReply));
        setReplies(displayPosts);
      } catch {
        setUser(undefined);
        setPosts([]);
        setReplies([]);
      }
    };

    loadPosts();
  }, [payload]);

  const horizontalScroll = (i: number) => {
    setIndex(i);
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="" />
      {user ? (
        <ScrollView>
          <View style={styles.header}>
            <CustomImage image={user.Image} customStyles={styles.placeholder} />

            <AdaptiveText
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 20,
              }}
            >
              {user.Name}
            </AdaptiveText>
          </View>

          <AdaptiveText
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 14,
              marginHorizontal: 20,
              marginVertical: 10,
            }}
          >
            {user.Description}
          </AdaptiveText>

          {/* Header area (sliding) */}
          <View style={styles.tabs}>
            {labels.map((label, i) => (
              <Pressable
                key={label}
                onPress={() => horizontalScroll(i)}
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
              { useNativeDriver: true },
            )}
          >
            <View style={[styles.page, { width }]}>
              {posts ? (
                <FlatList
                  data={posts}
                  scrollEnabled={false}
                  keyExtractor={(item) => String(item.Id)}
                  renderItem={({ item }) => {
                    return <ForumPost size="small" item={item} />;
                  }}
                />
              ) : (
                <AdaptiveText style={styles.noPosts}>
                  No posts available.
                </AdaptiveText>
              )}
            </View>

            <View style={[styles.page, { width }]}>
              {replies ? (
                <FlatList
                  data={replies}
                  scrollEnabled={false}
                  keyExtractor={(item) => String(item.Id)}
                  contentContainerStyle={{ width: 370 }}
                  renderItem={({ item }) => {
                    return <ForumPost size="small" item={item} />;
                  }}
                />
              ) : (
                <AdaptiveText style={styles.noPosts}>
                  No replies available.
                </AdaptiveText>
              )}
            </View>
          </Animated.ScrollView>
        </ScrollView>
      ) : (
        <AdaptiveText>No profile found.</AdaptiveText>
      )}
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
    noPosts: {
      marginTop: 20,
      fontFamily: "Poppins-Regular",
      alignSelf: "center",
    },
  });
};
