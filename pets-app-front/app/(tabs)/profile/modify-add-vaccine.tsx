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

const ModifyAddVaccine = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();
  const { payload } = useLocalSearchParams<{ payload?: any }>();

  const [showAdministeredDatePicker, setShowAdministeredDatePicker] =
    useState<boolean>(false);
  const [showNextDueDatePicker, setShowNextDueDatePicker] =
    useState<boolean>(false);

  const [vaccineAvailable, setVaccineAvailable] = useState<boolean>();
  const [selectedName, setSelectedName] = useState<string>();
  const [selectedStatus, setSelectedStatus] = useState<string>();
  const [administeredDate, setAdministeredDate] = useState<Date>(
    new Date(1598051730000),
  );
  const [nextDueDate, setNextDueDate] = useState<Date>(new Date(1598051730000));
  const [selectedNotes, setSelectedNotes] = useState<string>();

  const [statusModal, setStatusModal] = useState(false);

  const statusToChoose = [
    { id: 1, Name: "Done" },
    { id: 2, Name: "Not Done" },
    { id: 3, Name: "Due" },
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
      setVaccineAvailable(false);
      return;
    }

    setVaccineAvailable(true);
    setSelectedName(parsed.item.vaccineName);
    setSelectedStatus(parsed.item.status);
    setAdministeredDate(safeDate(parsed.item.dateAdministered));
    setNextDueDate(safeDate(parsed.item.nextDueDate));
    setSelectedNotes(parsed.item.notes);
    console.log(parsed);
  }, [payload]);

  const onChangeAdministered = (event: any, selectedDate: any) => {
    if (selectedDate) {
      setAdministeredDate(selectedDate);
    }
    setShowAdministeredDatePicker(false);
  };

  const onChangeNextDue = (event: any, selectedDate: any) => {
    if (selectedDate) {
      setNextDueDate(selectedDate);
    }
    setShowNextDueDatePicker(false);
  };

  const safeDate = (value: any, fallback = new Date()) => {
    if (!value) return fallback;
    const d = new Date(value);
    return isNaN(d.getTime()) ? fallback : d;
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
          {vaccineAvailable ? "Modify" : "Add"} Vaccination
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
          Date Administered
        </AdaptiveText>
        {Platform.OS === "android" && (
          <TouchableOpacity
            style={[styles.picker, { width: "auto" }]}
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
            mode={"date"}
            onChange={onChangeAdministered}
          />
        )}
        {Platform.OS === "ios" && (
          <DateTimePicker
            testID="dateTimePicker"
            value={administeredDate}
            mode={"date"}
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
                style={[styles.picker, { width: "auto" }]}
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
                mode={"date"}
                onChange={onChangeNextDue}
              />
            )}

            {Platform.OS === "ios" && (
              <DateTimePicker
                testID="dateTimePicker"
                value={nextDueDate}
                mode={"date"}
                onChange={onChangeNextDue}
              />
            )}
          </>
        )}

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
