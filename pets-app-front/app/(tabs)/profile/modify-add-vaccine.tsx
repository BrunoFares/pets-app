import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import ListWithoutConfirmationModal from "@/components/ListWithoutConfirmationModal";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { PetModel, VaccineRecordModel } from "@/data/models";
import { presentApiError } from "@/lib/api-feedback";
import { apiRequest } from "@/lib/api";
import { parseRoutePayload, toApiVaccineStatus } from "@/lib/profile-api";
import { AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ModifyAddVaccine = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();
  const { payload } = useLocalSearchParams<{ payload?: any }>();
  const router = useRouter();

  const [showAdministeredDatePicker, setShowAdministeredDatePicker] =
    useState(false);
  const [showNextDueDatePicker, setShowNextDueDatePicker] = useState(false);

  const [pet, setPet] = useState<PetModel>();
  const [vaccine, setVaccine] = useState<VaccineRecordModel>();
  const [selectedName, setSelectedName] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [administeredDate, setAdministeredDate] = useState<Date>(new Date());
  const [nextDueDate, setNextDueDate] = useState<Date>(new Date());
  const [selectedNotes, setSelectedNotes] = useState("");
  const [selectedVeterinarian, setSelectedVeterinarian] = useState("");
  const [statusModal, setStatusModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusToChoose = [
    { id: 1, Name: "Done" },
    { id: 2, Name: "Not Done" },
    { id: 3, Name: "Due" },
  ];

  useEffect(() => {
    const parsed = parseRoutePayload<{ item?: VaccineRecordModel; pet?: PetModel }>(
      payload,
    );
    if (!parsed) return;

    setPet(parsed.pet);

    if (!parsed.item) {
      setVaccine(undefined);
      return;
    }

    setVaccine(parsed.item);
    setSelectedName(parsed.item.vaccineName ?? "");
    setSelectedStatus(parsed.item.status ?? "");
    setAdministeredDate(
      parsed.item.dateAdministered
        ? new Date(parsed.item.dateAdministered)
        : new Date(),
    );
    setNextDueDate(
      parsed.item.nextDueDate ? new Date(parsed.item.nextDueDate) : new Date(),
    );
    setSelectedNotes(parsed.item.notes ?? "");
    setSelectedVeterinarian(parsed.item.veterinarian ?? "");
  }, [payload]);

  const onChangeAdministered = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setAdministeredDate(selectedDate);
    }
    setShowAdministeredDatePicker(false);
  };

  const onChangeNextDue = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setNextDueDate(selectedDate);
    }
    setShowNextDueDatePicker(false);
  };

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);

      return () => {
        setShowFooter?.(true);
      };
    }, [setShowFooter]),
  );

  const handleSave = async () => {
    if (!pet) {
      Alert.alert("Pet unavailable", "We couldn't determine which pet to use.");
      return;
    }

    if (!selectedName.trim()) {
      Alert.alert("Missing information", "Please enter the vaccine name.");
      return;
    }

    if (!selectedStatus) {
      Alert.alert("Missing information", "Please select the vaccine status.");
      return;
    }

    const body = {
      petId: pet.Id,
      vaccineName: selectedName.trim(),
      status: toApiVaccineStatus(selectedStatus),
      dateAdministered:
        selectedStatus === "Done" ? administeredDate.toISOString() : null,
      nextDueDate: selectedStatus === "Due" ? nextDueDate.toISOString() : null,
      notes: selectedNotes.trim() || null,
      veterinarian: selectedVeterinarian.trim() || null,
    };

    try {
      setIsSubmitting(true);

      if (vaccine) {
        await apiRequest(`/api/Vaccines/${vaccine.Id}`, {
          method: "PUT",
          body: JSON.stringify({
            vaccineName: body.vaccineName,
            status: body.status,
            dateAdministered: body.dateAdministered,
            nextDueDate: body.nextDueDate,
            notes: body.notes,
            veterinarian: body.veterinarian,
          }),
        });
      } else {
        await apiRequest("/api/Vaccines", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }

      router.back();
    } catch (error) {
      presentApiError("Unable to save vaccine", error, {
        networkMessage:
          "We couldn't reach the server, so the vaccine details were not saved.",
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
        <AdaptiveText style={styles.title}>
          {vaccine ? "Modify" : "Add"} Vaccination
        </AdaptiveText>

        <AdaptiveText style={{ width: "84%" }}>Name</AdaptiveText>
        <CustomInput
          value={selectedName}
          onChangeText={setSelectedName}
          style={{ width: "84%" }}
        />

        <AdaptiveText style={{ width: "84%" }}>Status</AdaptiveText>
        <TouchableOpacity style={styles.picker} onPress={() => setStatusModal(true)}>
          <AdaptiveText style={styles.textPicker}>
            {selectedStatus || "Select Status..."}
          </AdaptiveText>
          <AntDesign
            name="down"
            size={10}
            style={{ paddingRight: 16 }}
            color={darkMode ? colors.white : colors.veryDarkGrey}
          />
        </TouchableOpacity>

        <AdaptiveText style={{ width: "84%", marginBottom: 5, marginTop: 10 }}>
          Date Administered
        </AdaptiveText>
        {Platform.OS === "android" && (
          <TouchableOpacity
            style={[
              styles.picker,
              {
                width: "auto",
                backgroundColor: darkMode
                  ? colors.averageDarkGrey
                  : colors.white,
                borderWidth: 0,
              },
            ]}
            onPress={() => setShowAdministeredDatePicker(true)}
          >
            <AdaptiveText style={styles.textPicker}>
              {administeredDate.toLocaleDateString()}
            </AdaptiveText>
          </TouchableOpacity>
        )}
        {showAdministeredDatePicker && Platform.OS === "android" && (
          <DateTimePicker
            testID="dateTimePicker"
            value={administeredDate}
            mode="date"
            onChange={onChangeAdministered}
          />
        )}
        {Platform.OS === "ios" && (
          <DateTimePicker
            testID="dateTimePicker"
            value={administeredDate}
            mode="date"
            onChange={onChangeAdministered}
          />
        )}

        {selectedStatus === "Due" && (
          <>
            <AdaptiveText
              style={{ width: "84%", marginBottom: 5, marginTop: 10 }}
            >
              Next Due Date
            </AdaptiveText>

            {Platform.OS === "android" && (
              <TouchableOpacity
                style={[
                  styles.picker,
                  {
                    backgroundColor: darkMode
                      ? colors.averageDarkGrey
                      : colors.white,
                    width: "auto",
                    borderWidth: 0,
                  },
                ]}
                onPress={() => setShowNextDueDatePicker(true)}
              >
                <AdaptiveText style={styles.textPicker}>
                  {nextDueDate.toLocaleDateString()}
                </AdaptiveText>
              </TouchableOpacity>
            )}

            {showNextDueDatePicker && Platform.OS === "android" && (
              <DateTimePicker
                testID="dateTimePicker"
                value={nextDueDate}
                mode="date"
                onChange={onChangeNextDue}
              />
            )}

            {Platform.OS === "ios" && (
              <DateTimePicker
                testID="dateTimePicker"
                value={nextDueDate}
                mode="date"
                onChange={onChangeNextDue}
              />
            )}
          </>
        )}

        <AdaptiveText style={{ width: "84%" }}>Veterinarian</AdaptiveText>
        <CustomInput
          value={selectedVeterinarian}
          onChangeText={setSelectedVeterinarian}
          style={{ width: "84%" }}
        />

        <AdaptiveText style={{ width: "84%" }}>Notes</AdaptiveText>
        <CustomInput
          style={styles.notesInput}
          value={selectedNotes}
          onChangeText={setSelectedNotes}
          multiline
          textAlignVertical="top"
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
        title="Select the vaccination status"
        listElements={statusToChoose}
        visible={statusModal}
        onClose={() => setStatusModal(false)}
        onDone={(val: { Name: string }) => {
          setStatusModal(false);
          setSelectedStatus(val.Name);
        }}
      />

      {isSubmitting && <LoadingOverlay />}
    </SafeAreaView>
  );
};

export default ModifyAddVaccine;

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
    notesInput: {
      minHeight: 180,
      width: "84%",
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
