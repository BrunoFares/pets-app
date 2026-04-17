import { colors } from "@/constants/colors";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { AdaptiveText } from "./AdaptiveText";

const CustomImage = ({
  customStyles,
  image,
  withEdits = false,
}: {
  customStyles?: any;
  image?: any;
  withEdits?: boolean;
}) => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [chosenImage, setChosenImage] = useState<string | null>(null);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Permission to access the media library is required.",
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setChosenImage(result.assets[0].uri);
    }
  };

  return (
    <View style={[styles.pfpBox, customStyles]}>
      {chosenImage || image ? (
        <Image
          source={
            chosenImage
              ? { uri: chosenImage }
              : typeof image === "string"
                ? { uri: image }
                : image
          }
          style={[styles.pfp, customStyles]}
        />
      ) : (
        <View style={[styles.pfp, customStyles]} />
      )}

      {withEdits && (
        <TouchableOpacity
          onPress={() => {
            pickImage();
          }}
          style={styles.editBox}
        >
          <AdaptiveText style={{ fontSize: 12 }}>Edit Image</AdaptiveText>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CustomImage;

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    pfpBox: {
      alignItems: "center",
    },
    pfp: {
      height: 120,
      width: 120,
      borderRadius: 120,
      backgroundColor: colors.lightGrey,
    },
    editBox: {
      borderColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderWidth: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      padding: 10,
      bottom: 10,
      borderRadius: 20,
    },
  });
};
