import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import ListWithoutConfirmationModal from "@/components/ListWithoutConfirmationModal";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ModifyAddIllness = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();
  const { payload } = useLocalSearchParams<{ payload?: any }>();

  const [showDatePicker, setShowDatePicker] = useState(false);

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
          // keep as string if parsing fails
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
  }, [payload]);

  const onChangeDiagnosis = (event: any, selectedDate: any) => {
    if (selectedDate) {
      setDiagnosisDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const onChangeCure = (event: any, selectedDate: any) => {
    if (selectedDate) {
      setCuredDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);
    }, []),
  );

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="" />
      <ScrollView contentContainerStyle={{ alignItems: "center", gap: 10 }}>
        <AdaptiveText style={styles.title}>
          {illnessAvailable ? "Modify" : "Add"} Illness
        </AdaptiveText>

        <AdaptiveText style={{ width: "84%" }}>Name</AdaptiveText>
        <CustomInput
          value={selectedName}
          onChangeText={setSelectedName}
          style={{ width: "84%" }}
        />

        <AdaptiveText style={{ width: "84%" }}>Status</AdaptiveText>
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

        <AdaptiveText style={{ width: "84%", marginBottom: 5, marginTop: 10 }}>
          Diagnosis Date
        </AdaptiveText>
        {Platform.OS === "android" && (
          <TouchableOpacity
            style={[styles.picker, { width: "auto" }]}
            onPress={() => setShowDatePicker(true)}
          >
            <AdaptiveText style={styles.textPicker}>
              {diagnosisDate.toLocaleDateString()}
            </AdaptiveText>
          </TouchableOpacity>
        )}
        {showDatePicker && Platform.OS === "android" && (
          <DateTimePicker
            testID="dateTimePicker"
            value={diagnosisDate}
            mode={"date"}
            onChange={onChangeDiagnosis}
          />
        )}
        {Platform.OS === "ios" && (
          <DateTimePicker
            testID="dateTimePicker"
            value={diagnosisDate}
            mode={"date"}
            onChange={onChangeDiagnosis}
          />
        )}

        {selectedStatus === "Resolved" && (
          <>
            <AdaptiveText
              style={{ width: "84%", marginBottom: 5, marginTop: 10 }}
            >
              Cured Date
            </AdaptiveText>

            {Platform.OS === "android" && (
              <TouchableOpacity
                style={[styles.picker, { width: "auto" }]}
                onPress={() => setShowDatePicker(true)}
              >
                <AdaptiveText style={styles.textPicker}>
                  {curedDate.toLocaleDateString()}
                </AdaptiveText>
              </TouchableOpacity>
            )}

            {showDatePicker && Platform.OS === "android" && (
              <DateTimePicker
                testID="dateTimePicker"
                value={curedDate}
                mode={"date"}
                onChange={onChangeCure}
              />
            )}

            {Platform.OS === "ios" && (
              <DateTimePicker
                testID="dateTimePicker"
                value={curedDate}
                mode={"date"}
                onChange={onChangeCure}
              />
            )}
          </>
        )}

        <AdaptiveText style={{ width: "84%" }}>Description</AdaptiveText>
        <CustomInput style={{ height: 200 }} value={selectedDescription} />

        <AdaptiveText style={{ width: "84%" }}>Notes</AdaptiveText>
        <CustomInput style={{ height: 200 }} value={selectedNotes} />

        <TouchableOpacity style={styles.buttonSave}>
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
