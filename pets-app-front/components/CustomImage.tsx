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
  onImageSelected,
}: {
  customStyles?: any;
  image?: any;
  withEdits?: boolean;
  onImageSelected?: (asset: ImagePicker.ImagePickerAsset | null) => void;
}) => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [chosenImage, setChosenImage] = useState<string | null>(null);
  const imageUri =
    chosenImage || (typeof image === "string" && image ? image : null);
  const imageSource = imageUri
    ? { uri: imageUri }
    : image;

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
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      const asset = result.assets[0];
      setChosenImage(asset.uri);
      onImageSelected?.(asset);
    }
  };

  return (
    <View style={[styles.pfpBox, customStyles]}>
      {chosenImage || image ? (
        <Image
          key={imageUri ?? "static-image"}
          source={imageSource}
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
