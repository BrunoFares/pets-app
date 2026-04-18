import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import ListWithoutConfirmationModal from "@/components/ListWithoutConfirmationModal";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import {
  IllnessRecordModel,
  MedicationRecordModel,
  PetModel,
} from "@/data/models";
import { apiRequest } from "@/lib/api";
import {
  fetchIllnessMedications,
  parseRoutePayload,
  toApiIllnessStatus,
} from "@/lib/profile-api";
import { AntDesign, Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MedicationForm = {
  apiId?: string;
  dosage: string;
  frequency: string;
  id: number;
  instructions: string;
  name: string;
};

const createMedicationForm = (
  medication?: MedicationRecordModel,
  index = 0,
): MedicationForm => ({
  id: Date.now() + index,
  apiId: medication ? String(medication.Id) : undefined,
  name: medication?.medicationName ?? "",
  dosage: medication?.dosage ?? "",
  frequency: medication ? String(medication.frequencyInDays) : "",
  instructions: medication?.instructions ?? "",
});

const ModifyAddIllness = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();
  const { payload } = useLocalSearchParams<{ payload?: any }>();
  const router = useRouter();

  const [showDiagnosisDatePicker, setShowDiagnosisDatePicker] = useState(false);
  const [showCuredDatePicker, setShowCuredDatePicker] = useState(false);
  const [pet, setPet] = useState<PetModel>();
  const [illness, setIllness] = useState<IllnessRecordModel>();
  const [selectedName, setSelectedName] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [diagnosisDate, setDiagnosisDate] = useState<Date>(new Date());
  const [curedDate, setCuredDate] = useState<Date>(new Date());
  const [selectedNotes, setSelectedNotes] = useState("");
  const [selectedDescription, setSelectedDescription] = useState("");
  const [statusModal, setStatusModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMedications, setIsLoadingMedications] = useState(false);
  const [initialMedicationIds, setInitialMedicationIds] = useState<string[]>([]);
  const [medications, setMedications] = useState<MedicationForm[]>([
    createMedicationForm(),
  ]);
  const isLoading = isSubmitting || isLoadingMedications;

  const statusToChoose = useMemo(
    () => [
      { id: 1, Name: "Ongoing" },
      { id: 2, Name: "Resolved" },
    ],
    [],
  );

  useEffect(() => {
    const parsed = parseRoutePayload<{
      item?: IllnessRecordModel & { medications?: MedicationRecordModel[] };
      pet?: PetModel;
    }>(payload);

    if (!parsed) return;

    setPet(parsed.pet);

    if (!parsed.item) {
      setIllness(undefined);
      setInitialMedicationIds([]);
      return;
    }

    setIllness(parsed.item);
    setSelectedName(parsed.item.illnessName ?? "");
    setSelectedStatus(parsed.item.status ?? "");
    setDiagnosisDate(
      parsed.item.diagnosisDate
        ? new Date(parsed.item.diagnosisDate)
        : new Date(),
    );
    setCuredDate(
      parsed.item.curedDate ? new Date(parsed.item.curedDate) : new Date(),
    );
    setSelectedDescription(parsed.item.description ?? "");
    setSelectedNotes(parsed.item.notes ?? "");

    if (parsed.item.medications?.length) {
      setInitialMedicationIds(parsed.item.medications.map((item) => String(item.Id)));
      setMedications(
        parsed.item.medications.map((medication, index) =>
          createMedicationForm(medication, index),
        ),
      );
    } else {
      setInitialMedicationIds([]);
      setMedications([createMedicationForm()]);
    }
  }, [payload]);

  useEffect(() => {
    const loadMedications = async () => {
      if (!illness || medications.some((item) => item.apiId)) {
        setIsLoadingMedications(false);
        return;
      }

      setIsLoadingMedications(true);

      try {
        const response = await fetchIllnessMedications(illness.Id);
        if (response.length > 0) {
          setInitialMedicationIds(response.map((item) => String(item.Id)));
          setMedications(
            response.map((medication, index) =>
              createMedicationForm(medication, index),
            ),
          );
        }
      } catch (error) {
        console.error("[illness] Failed to load medications", error);
      } finally {
        setIsLoadingMedications(false);
      }
    };

    void loadMedications();
  }, [illness, medications]);

  const onChangeDiagnosis = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDiagnosisDate(selectedDate);
    }
    setShowDiagnosisDatePicker(false);
  };

  const onChangeCure = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setCuredDate(selectedDate);
    }
    setShowCuredDatePicker(false);
  };

  const addMedication = () => {
    setMedications((prev) => [...prev, createMedicationForm(undefined, prev.length)]);
  };

  const removeMedication = (id: number) => {
    setMedications((prev) => prev.filter((med) => med.id !== id));
  };

  const updateMedication = (
    id: number,
    field: keyof MedicationForm,
    value: string,
  ) => {
    setMedications((prev) =>
      prev.map((med) => (med.id === id ? { ...med, [field]: value } : med)),
    );
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
      Alert.alert("Missing information", "Please enter the illness name.");
      return;
    }

    if (!selectedStatus) {
      Alert.alert("Missing information", "Please select the illness status.");
      return;
    }

    const filledMedications = medications.filter(
      (medication) =>
        medication.name.trim() ||
        medication.dosage.trim() ||
        medication.frequency.trim() ||
        medication.instructions.trim(),
    );

    for (const medication of filledMedications) {
      if (!medication.name.trim()) {
        Alert.alert(
          "Medication information missing",
          "Each medication entry needs a medication name.",
        );
        return;
      }

      const frequency = Number(medication.frequency);
      if (!Number.isInteger(frequency) || frequency < 1) {
        Alert.alert(
          "Invalid medication frequency",
          "Medication frequency must be a whole number of days.",
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);

      let illnessId = illness ? Number(illness.Id) : null;

      if (illnessId) {
        await apiRequest(`/api/Illnesses/${illnessId}`, {
          method: "PUT",
          body: JSON.stringify({
            illnessName: selectedName.trim(),
            diagnosisDate: diagnosisDate.toISOString(),
            status: toApiIllnessStatus(selectedStatus),
            description: selectedDescription.trim() || null,
            notes: selectedNotes.trim() || null,
            curedDate:
              selectedStatus === "Resolved" ? curedDate.toISOString() : null,
          }),
        });
      } else {
        const created = await apiRequest<{ id: number }>("/api/Illnesses", {
          method: "POST",
          body: JSON.stringify({
            petId: pet.Id,
            illnessName: selectedName.trim(),
            diagnosisDate: diagnosisDate.toISOString(),
            status: toApiIllnessStatus(selectedStatus),
            description: selectedDescription.trim() || null,
            notes: selectedNotes.trim() || null,
            curedDate:
              selectedStatus === "Resolved" ? curedDate.toISOString() : null,
          }),
        });
        illnessId = created.id;
      }

      if (!illnessId) {
        throw new Error("Illness could not be saved.");
      }

      const initialMedicationIdsSet = new Set(initialMedicationIds);

      const currentMedicationIds = new Set(
        filledMedications
          .map((medication) => medication.apiId)
          .filter((value): value is string => !!value),
      );

      const medicationIdsToDelete = [...initialMedicationIdsSet].filter(
        (id) => !currentMedicationIds.has(id),
      );

      await Promise.all(
        medicationIdsToDelete.map((id) =>
          apiRequest(`/api/Medications/${id}`, { method: "DELETE" }),
        ),
      );

      for (const medication of filledMedications) {
        const medicationBody = {
          medicationName: medication.name.trim(),
          dosage: medication.dosage.trim() || null,
          instructions: medication.instructions.trim() || null,
          startDate: diagnosisDate.toISOString(),
          endDate:
            selectedStatus === "Resolved" ? curedDate.toISOString() : null,
          frequencyInDays: Number(medication.frequency),
          times: [],
          reminderEnabled: false,
          isActive: selectedStatus === "Ongoing",
        };

        if (medication.apiId) {
          await apiRequest(`/api/Medications/${medication.apiId}`, {
            method: "PUT",
            body: JSON.stringify(medicationBody),
          });
        } else {
          await apiRequest("/api/Medications", {
            method: "POST",
            body: JSON.stringify({
              illnessId,
              ...medicationBody,
            }),
          });
        }
      }

      router.back();
    } catch (error) {
      Alert.alert(
        "Unable to save illness",
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
        contentContainerStyle={styles.scrollContainer}
      >
        <AdaptiveText style={styles.title}>
          {illness ? "Modify" : "Add"} Illness
        </AdaptiveText>

        <AdaptiveText style={styles.label}>Name</AdaptiveText>
        <CustomInput
          value={selectedName}
          onChangeText={setSelectedName}
          style={styles.fullWidthInput}
        />

        <AdaptiveText style={styles.label}>Status</AdaptiveText>
        <TouchableOpacity
          style={[
            styles.picker,
            {
              backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
              borderColor: darkMode ? colors.darkGrey : colors.lightGrey,
              borderWidth: 1,
            },
          ]}
          onPress={() => setStatusModal(true)}
        >
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

        <AdaptiveText style={[styles.label, { marginTop: 10 }]}>
          Diagnosis Date
        </AdaptiveText>
        {Platform.OS === "android" && (
          <TouchableOpacity
            style={[styles.picker, { width: "auto" }]}
            onPress={() => setShowDiagnosisDatePicker(true)}
          >
            <AdaptiveText style={styles.textPicker}>
              {diagnosisDate.toLocaleDateString()}
            </AdaptiveText>
          </TouchableOpacity>
        )}
        {showDiagnosisDatePicker && Platform.OS === "android" && (
          <DateTimePicker
            testID="diagnosisDatePicker"
            value={diagnosisDate}
            mode="date"
            onChange={onChangeDiagnosis}
          />
        )}
        {Platform.OS === "ios" && (
          <DateTimePicker
            testID="diagnosisDatePicker"
            value={diagnosisDate}
            mode="date"
            onChange={onChangeDiagnosis}
          />
        )}

        {selectedStatus === "Resolved" && (
          <>
            <AdaptiveText style={[styles.label, { marginTop: 10 }]}>
              Cured Date
            </AdaptiveText>

            {Platform.OS === "android" && (
              <TouchableOpacity
                style={[styles.picker, { width: "auto" }]}
                onPress={() => setShowCuredDatePicker(true)}
              >
                <AdaptiveText style={styles.textPicker}>
                  {curedDate.toLocaleDateString()}
                </AdaptiveText>
              </TouchableOpacity>
            )}

            {showCuredDatePicker && Platform.OS === "android" && (
              <DateTimePicker
                testID="curedDatePicker"
                value={curedDate}
                mode="date"
                onChange={onChangeCure}
              />
            )}

            {Platform.OS === "ios" && (
              <DateTimePicker
                testID="curedDatePicker"
                value={curedDate}
                mode="date"
                onChange={onChangeCure}
              />
            )}
          </>
        )}

        <AdaptiveText style={styles.label}>Description</AdaptiveText>
        <CustomInput
          style={styles.bigInput}
          value={selectedDescription}
          onChangeText={setSelectedDescription}
          multiline
          textAlignVertical="top"
        />

        <AdaptiveText style={styles.label}>Notes</AdaptiveText>
        <CustomInput
          style={styles.bigInput}
          value={selectedNotes}
          onChangeText={setSelectedNotes}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.medicationsHeaderRow}>
          <AdaptiveText style={{ fontFamily: "Poppins-SemiBold", fontSize: 20 }}>
            Medications
          </AdaptiveText>
          <TouchableOpacity style={styles.addMedicationBtn} onPress={addMedication}>
            <Feather
              name="plus"
              size={16}
              color={darkMode ? colors.white : colors.black}
            />
            <AdaptiveText style={styles.addMedicationText}>Add</AdaptiveText>
          </TouchableOpacity>
        </View>

        {medications.map((med, index) => (
          <View key={med.id} style={styles.medicationCard}>
            <View style={styles.medicationTopRow}>
              <AdaptiveText style={styles.medicationTitle}>
                Medication {index + 1}
              </AdaptiveText>

              {medications.length > 1 && (
                <TouchableOpacity onPress={() => removeMedication(med.id)}>
                  <Feather name="trash-2" size={18} color={colors.red} />
                </TouchableOpacity>
              )}
            </View>

            <AdaptiveText style={styles.labelInner}>Medication Name</AdaptiveText>
            <CustomInput
              value={med.name}
              onChangeText={(text) => updateMedication(med.id, "name", text)}
              style={styles.medInput}
            />

            <AdaptiveText style={styles.labelInner}>Dosage</AdaptiveText>
            <CustomInput
              value={med.dosage}
              onChangeText={(text) => updateMedication(med.id, "dosage", text)}
              style={styles.medInput}
            />

            <AdaptiveText style={styles.labelInner}>Instructions</AdaptiveText>
            <CustomInput
              value={med.instructions}
              onChangeText={(text) =>
                updateMedication(med.id, "instructions", text)
              }
              style={styles.medInput}
            />

            <AdaptiveText style={styles.labelInner}>Frequency (days)</AdaptiveText>
            <CustomInput
              value={med.frequency}
              onChangeText={(text) =>
                updateMedication(med.id, "frequency", text)
              }
              keyboardType="number-pad"
              style={styles.medInput}
            />
          </View>
        ))}

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
        title="Select the status of the illness"
        listElements={statusToChoose}
        visible={statusModal}
        onClose={() => setStatusModal(false)}
        onDone={(val: { Name: string }) => {
          setStatusModal(false);
          setSelectedStatus(val.Name);
        }}
      />

      {isLoading && <LoadingOverlay />}
    </SafeAreaView>
  );
};

export default ModifyAddIllness;

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    scrollContainer: {
      alignItems: "center",
      gap: 10,
      paddingBottom: 30,
    },
    title: {
      fontSize: 24,
      fontFamily: "Poppins-SemiBold",
    },
    label: {
      width: "84%",
    },
    labelInner: {
      width: "100%",
      marginBottom: 4,
      marginTop: 4,
    },
    picker: {
      borderRadius: 16,
      backgroundColor: darkMode ? colors.averageDarkGrey : colors.white,
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
    fullWidthInput: {
      width: "84%",
    },
    bigInput: {
      minHeight: 140,
      width: "84%",
    },
    medicationsHeaderRow: {
      width: "84%",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
    },
    addMedicationBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: darkMode ? colors.averageDarkGrey : colors.white,
    },
    addMedicationText: {
      fontFamily: "Poppins-Medium",
    },
    medicationCard: {
      width: "84%",
      borderWidth: 1,
      borderColor: darkMode ? colors.darkGrey : colors.lightGrey,
      borderRadius: 16,
      padding: 20,
      gap: 6,
    },
    medicationTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    medicationTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 16,
    },
    buttonSave: {
      backgroundColor: colors.green,
      paddingVertical: 20,
      paddingHorizontal: 80,
      borderRadius: 20,
      marginBottom: "3%",
      marginTop: 20,
    },
    btnTextSave: {
      color: colors.white,
      fontFamily: "Poppins-Bold",
      fontSize: 18,
      textAlign: "center",
    },
    medInput: {
      width: "100%",
    },
  });
};
