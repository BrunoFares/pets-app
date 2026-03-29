import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import ListWithoutConfirmationModal from "@/components/ListWithoutConfirmationModal";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { AntDesign, Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
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
  id: number;
  name: string;
  dosage: string;
  frequency: string;
};

const ModifyAddIllness = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();
  const { payload } = useLocalSearchParams<{ payload?: any }>();

  const [showDiagnosisDatePicker, setShowDiagnosisDatePicker] = useState(false);
  const [showCuredDatePicker, setShowCuredDatePicker] = useState(false);

  const [illnessAvailable, setIllnessAvailable] = useState<boolean>();
  const [selectedName, setSelectedName] = useState<string>();
  const [selectedStatus, setSelectedStatus] = useState<string>();
  const [diagnosisDate, setDiagnosisDate] = useState<Date>(
    new Date(1598051730000),
  );
  const [curedDate, setCuredDate] = useState<Date>(new Date(1598051730000));
  const [selectedNotes, setSelectedNotes] = useState<string>();
  const [selectedDescription, setSelectedDescription] = useState<string>();

  const [statusModal, setStatusModal] = useState(false);

  const [medications, setMedications] = useState<MedicationForm[]>([
    { id: Date.now(), name: "", dosage: "", frequency: "" },
  ]);

  const statusToChoose = [
    { id: 1, Name: "Ongoing" },
    { id: 2, Name: "Resolved" },
  ];

  useEffect(() => {
    if (!payload) return;

    let parsed: any = payload;
    if (typeof payload === "string") {
      try {
        parsed = JSON.parse(decodeURIComponent(payload));
      } catch (e) {
        try {
          parsed = JSON.parse(payload);
        } catch (e2) {
          parsed = payload;
        }
      }
    }

    if (!parsed) {
      setIllnessAvailable(false);
      return;
    }

    setIllnessAvailable(true);
    setSelectedName(parsed.item.illnessName);
    setSelectedStatus(parsed.item.status);
    setDiagnosisDate(new Date(parsed.item.diagnosisDate));
    setCuredDate(new Date(parsed.item.curedDate));
    setSelectedDescription(parsed.item.description);
    setSelectedNotes(parsed.item.notes);

    if (parsed.item.medications && Array.isArray(parsed.item.medications)) {
      setMedications(
        parsed.item.medications.map((med: any, index: number) => ({
          id: med.id ?? Date.now() + index,
          name: med.name ?? "",
          dosage: med.dosage ?? "",
          frequency: med.frequency ?? "",
        })),
      );
    }
  }, [payload]);

  const onChangeDiagnosis = (event: any, selectedDate: any) => {
    if (selectedDate) {
      setDiagnosisDate(selectedDate);
    }
    setShowDiagnosisDatePicker(false);
  };

  const onChangeCure = (event: any, selectedDate: any) => {
    if (selectedDate) {
      setCuredDate(selectedDate);
    }
    setShowCuredDatePicker(false);
  };

  const addMedication = () => {
    setMedications((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: "",
        dosage: "",
        frequency: "",
      },
    ]);
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
    }, []),
  );

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
          {illnessAvailable ? "Modify" : "Add"} Illness
        </AdaptiveText>

        <AdaptiveText style={styles.label}>Name</AdaptiveText>
        <CustomInput
          value={selectedName}
          onChangeText={setSelectedName}
          style={styles.fullWidthInput}
        />

        <AdaptiveText style={styles.label}>Status</AdaptiveText>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => {
            setStatusModal(true);
          }}
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
        />

        <AdaptiveText style={styles.label}>Notes</AdaptiveText>
        <CustomInput
          style={styles.bigInput}
          value={selectedNotes}
          onChangeText={setSelectedNotes}
        />

        <View style={styles.medicationsHeaderRow}>
          <AdaptiveText
            style={{ fontFamily: "Poppins-SemiBold", fontSize: 20 }}
          >
            Medications
          </AdaptiveText>
          <TouchableOpacity
            style={styles.addMedicationBtn}
            onPress={addMedication}
          >
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

            <AdaptiveText style={styles.labelInner}>
              Medication Name
            </AdaptiveText>
            <CustomInput
              value={med.name}
              onChangeText={(text: string) =>
                updateMedication(med.id, "name", text)
              }
              style={styles.medInput}
            />

            <AdaptiveText style={styles.labelInner}>Dosage</AdaptiveText>
            <CustomInput
              value={med.dosage}
              onChangeText={(text: string) =>
                updateMedication(med.id, "dosage", text)
              }
              style={styles.medInput}
            />

            <AdaptiveText style={styles.labelInner}>Frequency</AdaptiveText>
            <CustomInput
              value={med.frequency}
              onChangeText={(text: string) =>
                updateMedication(med.id, "frequency", text)
              }
              style={styles.medInput}
            />
          </View>
        ))}

        <TouchableOpacity
          style={styles.buttonSave}
          onPress={() => {
            const illnessData = {
              illnessName: selectedName,
              status: selectedStatus,
              diagnosisDate,
              curedDate: selectedStatus === "Resolved" ? curedDate : null,
              description: selectedDescription,
              notes: selectedNotes,
              medications,
            };

            console.log("Saving illness:", illnessData);
          }}
        >
          <Text style={styles.btnTextSave}>Save changes</Text>
        </TouchableOpacity>
      </ScrollView>

      <ListWithoutConfirmationModal
        title={"Select the status of the illness"}
        listElements={statusToChoose}
        visible={statusModal}
        onClose={() => {
          setStatusModal(false);
        }}
        onDone={(val: any) => {
          setStatusModal(false);
          setSelectedStatus(val.Name);
        }}
      />
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
    fullWidthInput: {
      width: "84%",
    },
    bigInput: {
      height: 200,
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
      borderWidth: 1,
      borderColor: darkMode ? colors.darkGrey : colors.lightGrey,
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
