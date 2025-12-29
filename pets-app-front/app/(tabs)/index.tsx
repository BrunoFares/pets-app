import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import CustomImage from "@/components/CustomImage";
import { colors } from "@/constants/colors";
import { useHeaderSlide } from "@/hooks/useHeaderSlide";
import { Entypo, FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [componentWidth, setComponentWidth] = useState(0);
  const darkMode = useColorScheme() === "dark";
  const router = useRouter();
  const styles = createStyles({ darkMode, componentWidth });
  const [user, setUser] = useState({
    name: "Bruno",
    picture: "",
    pets: [
      {
        key: 1,
        name: "Kalinka",
      },
      {
        key: 2,
        name: "Minouche",
      },
    ],
  });

  const items = [
    {
      key: 1,
      name: "BETA",
      location: "Hazmieh, Mount Lebanon",
      rating: 3.8,
      image: "Users/brunofares/Desktop/mourinho.jpeg",
    },
    {
      key: 3,
      name: "Bruno Fares albo kbir",
      location: "Mansourieh, Mount Lebanon",
      rating: 5.0,
      image: "",
    },
    {
      key: 4,
      name: "Whatever man",
      location: "Ain Hircha, Beqaa",
      rating: 0.3,
      image: "",
    },
  ];

  const { translateY } = useHeaderSlide({ height: 200 });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={[styles.header, { transform: [{ translateY }] }]}>
          <AdaptiveText
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 24,
            }}
          >
            Welcome back,{" "}
            <Text style={{ color: darkMode ? colors.white : colors.green }}>
              {user.name}
            </Text>
            !
          </AdaptiveText>
        </Animated.View>

        <AdaptiveView style={styles.tips}>
          <View style={styles.divisionTitleSection}>
            <MaterialCommunityIcons
              name="lightbulb-on"
              size={14}
              color={darkMode ? colors.white : colors.green}
            />
            <AdaptiveText style={styles.divisionTitle}>
              Tip of the day
            </AdaptiveText>
          </View>
          <AdaptiveText
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 16,
            }}
          >
            Ella sabaho la bsayntak men 3aboukra la tfarrehla alba.
          </AdaptiveText>
        </AdaptiveView>

        <AdaptiveView
          style={{
            width: "90%",
            height: 200,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 30,

            // shadow
            shadowColor: colors.black,
            shadowOffset: {
              width: darkMode ? 5 : 0,
              height: 10,
            },
            shadowRadius: 10,
            shadowOpacity: darkMode ? 0.5 : 0.1,

            elevation: 10,
          }}
        >
          <AdaptiveText
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 16,
            }}
          >
            To be done.
          </AdaptiveText>
        </AdaptiveView>

        <AdaptiveView style={styles.tips}>
          <AdaptiveView style={styles.divisionTitleSection}>
            <FontAwesome6
              name="hand-holding-heart"
              size={14}
              color={darkMode ? colors.white : colors.green}
            />
            <AdaptiveText style={styles.divisionTitle}>
              Donate to charity
            </AdaptiveText>
          </AdaptiveView>

          <AdaptiveView
            style={{
              flexDirection: "row",
              gap: 10,
            }}
          >
            <TouchableOpacity
              onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                setComponentWidth(width);
              }}
              style={{ flex: 1 }}
              onPress={() => {
                const payload = encodeURIComponent(JSON.stringify(items[0]));
                router.push({
                  pathname: "/individual-charity-screen",
                  params: { key: String(items[0].key), payload },
                });
              }}
            >
              <CustomImage image={user.picture} customStyles={styles.pfp} />
            </TouchableOpacity>

            <TouchableOpacity
              onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                setComponentWidth(width);
              }}
              style={{ flex: 1 }}
              onPress={() => {
                const payload = encodeURIComponent(JSON.stringify(items[1]));
                router.push({
                  pathname: "/individual-charity-screen",
                  params: { key: String(items[1].key), payload },
                });
              }}
            >
              <CustomImage image={user.picture} customStyles={styles.pfp} />
            </TouchableOpacity>

            <TouchableOpacity
              onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                setComponentWidth(width);
              }}
              style={{ flex: 1 }}
              onPress={() => {
                const payload = encodeURIComponent(JSON.stringify(items[2]));
                router.push({
                  pathname: "/individual-charity-screen",
                  params: { key: String(items[2].key), payload },
                });
              }}
            >
              <CustomImage image={user.picture} customStyles={styles.pfp} />
            </TouchableOpacity>
          </AdaptiveView>

          <TouchableOpacity
            style={{ alignSelf: "flex-end" }}
            onPress={() => router.push("/charities-list-screen")}
          >
            <Text
              style={{
                fontFamily: "Poppins-Medium",
                fontSize: 12,
                color: darkMode ? colors.lightGrey : colors.green,
              }}
            >
              More Charity Organisations →
            </Text>
          </TouchableOpacity>
        </AdaptiveView>

        <AdaptiveView style={styles.tips}>
          <AdaptiveView style={styles.divisionTitleSection}>
            <Entypo name="modern-mic" size={14} color={darkMode ? colors.white : colors.green} />
            <AdaptiveText style={styles.divisionTitle}>
              Pet Translator
            </AdaptiveText>
          </AdaptiveView>

        </AdaptiveView>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode, componentWidth }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      width: useWindowDimensions().width,
      alignItems: "center",
      gap: 12,
      paddingTop: Platform.select({
        android: 10,
      }),
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    header: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginTop: 20,
      borderRadius: 30,
      alignSelf: "center",
    },
    tips: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 30,
      width: "90%",
      alignSelf: "center",
      gap: 10,

      // shadow
      shadowColor: colors.black,
      shadowOffset: {
        width: darkMode ? 5 : 0,
        height: 10,
      },
      shadowRadius: 10,
      shadowOpacity: darkMode ? 0.5 : 0.1,

      elevation: 10,
    },
    divisionTitleSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    divisionTitle: {
      fontFamily: "Poppins-Regular",
      fontSize: 12,
      color: darkMode ? colors.white : colors.green,
    },
    pfp: {
      height: componentWidth,
      width: "100%",
      borderRadius: 30,
      backgroundColor: colors.lightGrey,
    },
  });
};
