import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthProvider";
import { useGlobal } from "@/contexts/GlobalProvider";
import { PlaceOwnerApplicationModel } from "@/data/models";
import { presentApiError } from "@/lib/api-feedback";
import {
  createPlaceOwnerApplication,
  PlaceOwnerApplicationInput,
} from "@/lib/place-owner-api";
import { parseRoutePayload } from "@/lib/profile-api";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PLACE_TYPE_OPTIONS: PlaceOwnerApplicationInput["requestedPlaceType"][] = [
  "Vet",
  "PetShop",
  "Other",
];

export default function PlaceOwnerApplicationScreen() {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const router = useRouter();
  const { payload } = useLocalSearchParams<{ payload?: string }>();
  const { setShowFooter } = useGlobal();
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [requestedPlaceType, setRequestedPlaceType] =
    useState<PlaceOwnerApplicationInput["requestedPlaceType"]>("Vet");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const latestApplication = useMemo(() => {
    const parsed = parseRoutePayload<{ application?: PlaceOwnerApplicationModel }>(
      payload,
    );

    return parsed?.application ?? null;
  }, [payload]);

  useEffect(() => {
    setBusinessName(latestApplication?.BusinessName ?? "");
    setPhone(latestApplication?.Phone ?? "");
    setEmail(latestApplication?.Email ?? user?.Email ?? "");
    setDescription(latestApplication?.Description ?? "");
    setAddressLine1(latestApplication?.AddressLine1 ?? "");
    setAddressLine2(latestApplication?.AddressLine2 ?? "");
    setCity(latestApplication?.City ?? "");
    setCountry(latestApplication?.Country ?? "");
    setRequestedPlaceType(latestApplication?.RequestedPlaceType ?? "Vet");
  }, [latestApplication, user?.Email]);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);

      return () => {
        setShowFooter?.(true);
      };
    }, [setShowFooter]),
  );

  const handleSubmit = async () => {
    if (!businessName.trim()) {
      Alert.alert("Missing information", "Please enter your business name.");
      return;
    }

    if (!phone.trim() || !email.trim()) {
      Alert.alert(
        "Missing information",
        "Please enter a contact phone number and email address.",
      );
      return;
    }

    if (!addressLine1.trim() || !city.trim() || !country.trim()) {
      Alert.alert(
        "Missing information",
        "Please enter the address, city, and country for this place.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      await createPlaceOwnerApplication({
        businessName,
        phone,
        email,
        description,
        addressLine1,
        addressLine2,
        city,
        country,
        requestedPlaceType,
      });

      router.replace("/profile/place-manager");
    } catch (error) {
      presentApiError("Could not submit application", error, {
        fallbackMessage:
          "We couldn't submit your place-owner application right now.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Owner Application" />

      <ScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        contentContainerStyle={styles.content}
      >
        <View style={styles.heroCard}>
          <AdaptiveText style={styles.title}>Apply To Manage A Place</AdaptiveText>
          <AdaptiveText style={styles.subtitle}>
            Share the details for your vet clinic, pet shop, or charity
            organisation so an admin can review your request.
          </AdaptiveText>
        </View>

        <AdaptiveText style={styles.sectionLabel}>Place Type</AdaptiveText>
        <View style={styles.optionRow}>
          {PLACE_TYPE_OPTIONS.map((option) => {
            const isSelected = requestedPlaceType === option;

            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionChip,
                  isSelected ? styles.optionChipSelected : null,
                ]}
                onPress={() => setRequestedPlaceType(option)}
                activeOpacity={0.85}
              >
                <AdaptiveText
                  style={[
                    styles.optionChipText,
                    isSelected ? styles.optionChipTextSelected : null,
                  ]}
                >
                  {option === "PetShop" ? "Pet Shop" : option}
                </AdaptiveText>
              </TouchableOpacity>
            );
          })}
        </View>

        <AdaptiveText style={styles.sectionLabel}>Business Name</AdaptiveText>
        <CustomInput value={businessName} onChangeText={setBusinessName} />

        <AdaptiveText style={styles.sectionLabel}>Phone</AdaptiveText>
        <CustomInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <AdaptiveText style={styles.sectionLabel}>Email</AdaptiveText>
        <CustomInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <AdaptiveText style={styles.sectionLabel}>Description</AdaptiveText>
        <CustomInput
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
          style={styles.descriptionInput}
        />

        <AdaptiveText style={styles.sectionLabel}>Address Line 1</AdaptiveText>
        <CustomInput value={addressLine1} onChangeText={setAddressLine1} />

        <AdaptiveText style={styles.sectionLabel}>Address Line 2</AdaptiveText>
        <CustomInput value={addressLine2} onChangeText={setAddressLine2} />

        <AdaptiveText style={styles.sectionLabel}>City</AdaptiveText>
        <CustomInput value={city} onChangeText={setCity} />

        <AdaptiveText style={styles.sectionLabel}>Country</AdaptiveText>
        <CustomInput value={country} onChangeText={setCountry} />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          <AdaptiveText style={styles.submitButtonText}>
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </AdaptiveText>
        </TouchableOpacity>
      </ScrollView>

      {isSubmitting && <LoadingOverlay />}
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode }: { darkMode: boolean }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    content: {
      alignItems: "center",
      paddingBottom: 36,
      gap: 8,
    },
    heroCard: {
      width: "92%",
      marginTop: 18,
      padding: 20,
      borderRadius: 24,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      gap: 10,
    },
    title: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 24,
      lineHeight: 30,
    },
    subtitle: {
      fontFamily: "Poppins-Regular",
      fontSize: 14,
      lineHeight: 22,
      opacity: 0.84,
    },
    sectionLabel: {
      width: "84%",
      marginTop: 8,
      marginBottom: -4,
      fontFamily: "Poppins-Medium",
    },
    optionRow: {
      width: "84%",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 4,
    },
    optionChip: {
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    optionChipSelected: {
      backgroundColor: colors.green,
    },
    optionChipText: {
      fontFamily: "Poppins-Medium",
    },
    optionChipTextSelected: {
      color: colors.white,
    },
    descriptionInput: {
      width: "84%",
      minHeight: 160,
    },
    submitButton: {
      width: "84%",
      borderRadius: 20,
      paddingVertical: 18,
      marginTop: 20,
      backgroundColor: colors.green,
    },
    submitButtonText: {
      color: colors.white,
      fontFamily: "Poppins-Bold",
      fontSize: 18,
      textAlign: "center",
    },
  });
