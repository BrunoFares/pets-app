import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import ListWithoutConfirmationModal from "@/components/ListWithoutConfirmationModal";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { PetModel } from "@/data/models";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { presentApiError } from "@/lib/api-feedback";
import { apiRequest } from "@/lib/api";
import {
  VetOption,
  fetchVetOptions,
  parseRoutePayload,
} from "@/lib/profile-api";
import { AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AddConsultation = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();
  const { payload } = useLocalSearchParams<{ payload?: any }>();
  const router = useRouter();

  const [pet, setPet] = useState<PetModel>();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [details, setDetails] = useState("");
  const [selectedVet, setSelectedVet] = useState<VetOption>();
  const [vetOptions, setVetOptions] = useState<VetOption[]>([]);
  const [vetModal, setVetModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingVets, setIsLoadingVets] = useState(true);
  const isLoading = isSubmitting || isLoadingVets;

  const onChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);

      return () => {
        setShowFooter?.(true);
      };
    }, [setShowFooter]),
  );

  useEffect(() => {
    const parsed = parseRoutePayload<{ pet?: PetModel }>(payload);
    if (parsed?.pet) {
      setPet(parsed.pet);
    }
  }, [payload]);

  const loadVetOptions = useCallback(async () => {
    setIsLoadingVets(true);

    try {
      const vets = await fetchVetOptions();
      setVetOptions(vets);
    } catch (error) {
      presentApiError("Unable to load vets", error);
    } finally {
      setIsLoadingVets(false);
    }
  }, []);

  useEffect(() => {
    void loadVetOptions();
  }, [loadVetOptions]);

  const { isRefreshing, onRefresh } = usePullToRefresh(loadVetOptions);
  const showLoadingOverlay = isLoading && !isRefreshing;

  const handleSave = async () => {
    if (!pet) {
      Alert.alert("Pet unavailable", "We couldn't determine which pet to use.");
      return;
    }

    if (!details.trim()) {
      Alert.alert(
        "Missing information",
        "Please add some consultation details before saving.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest("/api/Consultations", {
        method: "POST",
        body: JSON.stringify({
          petId: pet.Id,
          vetPlaceId: selectedVet?.Id ?? null,
          date: date.toISOString(),
          details: details.trim(),
        }),
      });

      router.back();
    } catch (error) {
      presentApiError("Unable to save consultation", error, {
        networkMessage:
          "We couldn't reach the server, so the consultation was not saved.",
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
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <AdaptiveText style={styles.title}>Add Consultation</AdaptiveText>

        {pet?.Name && (
          <AdaptiveText style={styles.subtitle}>For {pet.Name}</AdaptiveText>
        )}

        <AdaptiveText style={{ width: "84%", marginBottom: 5, marginTop: 10 }}>
          Date of Consultation
        </AdaptiveText>
        {Platform.OS === "android" && (
          <TouchableOpacity
            style={[styles.picker, { width: "auto" }]}
            onPress={() => setShowDatePicker(true)}
          >
            <AdaptiveText style={styles.textPicker}>
              {date.toLocaleDateString()}
            </AdaptiveText>
          </TouchableOpacity>
        )}
        {showDatePicker && Platform.OS === "android" && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            onChange={onChange}
          />
        )}
        {Platform.OS === "ios" && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            onChange={onChange}
          />
        )}

        <AdaptiveText style={{ width: "84%" }}>Vet</AdaptiveText>
        <TouchableOpacity style={styles.picker} onPress={() => setVetModal(true)}>
          <AdaptiveText style={styles.textPicker}>
            {selectedVet?.Name || "Select vet (optional)..."}
          </AdaptiveText>
          <AntDesign
            name="down"
            size={10}
            style={{ paddingRight: 16 }}
            color={darkMode ? colors.white : colors.veryDarkGrey}
          />
        </TouchableOpacity>

        <AdaptiveText style={{ width: "84%" }}>Description</AdaptiveText>
        <CustomInput
          value={details}
          onChangeText={setDetails}
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

      <ListWithoutConfirmationModal
        title="Select the veterinarian"
        listElements={vetOptions}
        visible={vetModal}
        onClose={() => setVetModal(false)}
        onDone={(val: VetOption) => {
          setVetModal(false);
          setSelectedVet(val);
        }}
      />

      {showLoadingOverlay && <LoadingOverlay />}
    </SafeAreaView>
  );
};

export default AddConsultation;

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
    subtitle: {
      fontFamily: "Poppins-Light",
      fontSize: 14,
      opacity: 0.8,
    },
    picker: {
      borderColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderWidth: 1,
      borderRadius: 16,
      width: "85%",
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    textPicker: {
      fontSize: 16,
      fontFamily: "Poppins-Regular",
      color: darkMode ? colors.white : colors.black,
      paddingVertical: 12,
      paddingHorizontal: 16,
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
