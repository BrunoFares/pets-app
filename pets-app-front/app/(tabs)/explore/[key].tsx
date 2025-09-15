import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import { PageHeader } from "@/components/PageHeader";
import ReviewPost from "@/components/ReviewPost";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { AntDesign } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Shop = {
  key: string;
  name: string;
  location: string;
  rating: number;
  image?: string;
  description?: string;
};

export default function ShopDetails() {
  const { payload } = useLocalSearchParams<{ payload?: string }>();
  const shop: Shop | null = payload
    ? JSON.parse(decodeURIComponent(payload))
    : null;
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();

  const [reviews, setReviews] = useState([
    {
      key: 1,
      title: "rev1",
      user: "kalinka",
      body: "reviewbody typeshit",
    },
    {
      key: 2,
      title: "re 2",
      user: "minouche",
      body: "matrix matrix martain garrix",
    },
    {
      key: 3,
      title: "rev3",
      user: "serge",
      body: "oui",
    },
    {
      key: 4,
      title: "rev4",
      user: "allah",
      body: "marhaba kif el chabeb khallik healthy kermela la elsy",
    },
    {
      key: 5,
      title: "rev5",
      user: "kalinka",
      body: "rje3et",
    },
  ]);

  if (!shop) return <Text style={{ margin: 24 }}>Missing shop data.</Text>;

  return (
    <SafeAreaView
      style={{ backgroundColor: darkMode ? colors.veryDarkGrey : colors.white }}
    >
      <PageHeader title="" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <FlatList
          data={reviews}
          keyExtractor={(item) => String(item.key)}
          contentContainerStyle={{
            backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
          }}
          ListHeaderComponent={
            <>
              {shop.image ? (
                <Image source={{ uri: shop.image }} style={{ height: 400 }} />
              ) : (
                <View
                  style={{ height: 400, backgroundColor: colors.lightGrey }}
                />
              )}
              <AdaptiveText
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  marginLeft: 10,
                  marginTop: 10,
                  fontFamily: "Poppins-Medium",
                }}
              >
                {shop.name}
              </AdaptiveText>
              <AdaptiveText
                style={{
                  marginTop: 4,
                  marginLeft: 10,
                  fontFamily: "Poppins-Regular",
                }}
              >
                {shop.location}
              </AdaptiveText>
              <AdaptiveText
                style={{
                  marginTop: 4,
                  marginLeft: 10,
                  fontFamily: "Poppins-Bold",
                }}
              >
                ★ {shop.rating}
              </AdaptiveText>
              {shop.description ? (
                <AdaptiveText
                  style={{ marginTop: 12, fontFamily: "Poppins-Regular" }}
                >
                  {shop.description}
                </AdaptiveText>
              ) : null}

              <AdaptiveView style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Reply to user1..."
                  placeholderTextColor={
                    darkMode ? colors.lightGrey : colors.darkGrey
                  }
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
          }
          renderItem={({ item }) => {
            return <ReviewPost item={item} />;
          }}
        />
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    textInputContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      borderBottomColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderBottomWidth: 1,
      borderTopColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderTopWidth: 1,
      marginTop: 14,
    },
    textInput: {
      width: "80%",
      fontFamily: "Poppins-Regular",
      fontSize: 18,
      paddingVertical: 20,
      color: darkMode ? colors.white : colors.black,
    },
  });
};
