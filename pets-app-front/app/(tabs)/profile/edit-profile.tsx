import { AdaptiveText } from "@/components/AdaptiveText";
import CustomImage from "@/components/CustomImage";
import CustomInput from "@/components/CustomInput";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthProvider";
import { useGlobal } from "@/contexts/GlobalProvider";
import { apiRequest } from "@/lib/api";
import { presentApiError } from "@/lib/api-feedback";
import { uploadUserAvatar } from "@/lib/profile-api";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
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

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [description, setDescription] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedImageAsset, setSelectedImageAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setUsername(user?.Username ?? "");
    setFirstName(user?.FirstName ?? "");
    setLastName(user?.LastName ?? "");
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
    if (!username.trim() || !firstName.trim() || !lastName.trim()) {
      Alert.alert(
        "Missing information",
        "Please enter your username, first name, and last name.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      await apiRequest("/api/Users/edit-profile", {
        method: "PUT",
        body: JSON.stringify({
          username: username.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          description: description.trim(),
        }),
      });

      if (selectedImageAsset) {
        await uploadUserAvatar(selectedImageAsset);
      }

      await refreshProfile();
      router.back();
    } catch (error) {
      presentApiError("Unable to update profile", error, {
        networkMessage:
          "We couldn't reach the server, so your profile changes were not saved.",
      });
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
              Username
            </AdaptiveText>
            <CustomInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              style={{ width: "100%" }}
            />
          </View>
        </View>

        <AdaptiveText style={styles.inputText}>First Name</AdaptiveText>
        <CustomInput
          value={firstName}
          onChangeText={setFirstName}
          style={{ width: "84%" }}
        />

        <AdaptiveText style={styles.inputText}>Last Name</AdaptiveText>
        <CustomInput
          value={lastName}
          onChangeText={setLastName}
          style={{ width: "84%" }}
        />

        <AdaptiveText style={styles.inputText}>Description</AdaptiveText>
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

      {isSubmitting && <LoadingOverlay />}
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
    inputText: {
      width: "84%",
      marginBottom: -7,
    },
  });
};
