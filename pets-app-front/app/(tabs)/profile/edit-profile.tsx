import { AdaptiveText } from "@/components/AdaptiveText";
import CustomImage from "@/components/CustomImage";
import CustomInput from "@/components/CustomInput";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthProvider";
import { useGlobal } from "@/contexts/GlobalProvider";
import { apiRequest } from "@/lib/api";
import { uploadUserAvatar } from "@/lib/profile-api";
import { useFocusEffect, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EditProfile = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();
  const { user, refreshProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedImageAsset, setSelectedImageAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(user?.Name ?? "");
    setFirstName(user?.FirstName ?? "");
    setLastName(user?.LastName ?? "");
    setPhoneNumber(user?.PhoneNumber ?? "");
    setDescription(user?.Description ?? "");
    setProfileImage(user?.Image ?? null);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);

      return () => {
        setShowFooter?.(true);
      };
    }, [setShowFooter]),
  );

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(
        "Missing information",
        "Please enter your first and last name.",
      );
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert("Missing information", "Please enter your phone number.");
      return;
    }

    try {
      setIsSubmitting(true);

      await apiRequest("/api/Users/edit-profile", {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim() || `${firstName.trim()} ${lastName.trim()}`.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phoneNumber.trim(),
          description: description.trim(),
        }),
      });

      if (selectedImageAsset) {
        await uploadUserAvatar(selectedImageAsset);
      }

      await refreshProfile();
      router.back();
    } catch (error) {
      Alert.alert(
        "Unable to update profile",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="" />
      <ScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        contentContainerStyle={{ alignItems: "center", gap: 10 }}
      >
        <AdaptiveText style={styles.title}>Edit Profile</AdaptiveText>

        <View
          style={{
            flexDirection: "row",
            width: "85%",
            gap: 20,
            marginTop: 20,
          }}
        >
          <View>
            <CustomImage
              image={profileImage}
              withEdits
              onImageSelected={setSelectedImageAsset}
            />
          </View>
          <View
            style={{
              width: 200,
              alignItems: "center",
            }}
          >
            <AdaptiveText style={{ width: "100%", marginBottom: 5 }}>
              Display Name
            </AdaptiveText>
            <CustomInput
              value={name}
              onChangeText={setName}
              style={{ width: "100%" }}
            />
          </View>
        </View>

        <AdaptiveText style={{ width: "84%" }}>First Name</AdaptiveText>
        <CustomInput
          value={firstName}
          onChangeText={setFirstName}
          style={{ width: "84%" }}
        />

        <AdaptiveText style={{ width: "84%" }}>Last Name</AdaptiveText>
        <CustomInput
          value={lastName}
          onChangeText={setLastName}
          style={{ width: "84%" }}
        />

        <AdaptiveText style={{ width: "84%" }}>Phone Number</AdaptiveText>
        <CustomInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          style={{ width: "84%" }}
        />

        <AdaptiveText style={{ width: "84%" }}>Description</AdaptiveText>
        <CustomInput
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
          style={styles.descriptionInput}
        />

        <TouchableOpacity
          style={styles.buttonSave}
          disabled={isSubmitting}
          onPress={handleSave}
        >
          <Text style={styles.btnTextSave}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfile;

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    title: {
      fontSize: 24,
      fontFamily: "Poppins-SemiBold",
    },
    descriptionInput: {
      width: "84%",
      minHeight: 180,
    },
    buttonSave: {
      backgroundColor: colors.green,
      paddingVertical: 20,
      paddingHorizontal: 80,
      borderRadius: 20,
      marginBottom: "10%",
      marginTop: 20,
    },
    btnTextSave: {
      color: colors.white,
      fontFamily: "Poppins-Bold",
      fontSize: 18,
      textAlign: "center",
    },
  });
};
