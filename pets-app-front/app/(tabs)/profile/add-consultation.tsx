import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { BreedModel, Color, Sex, SpeciesModel } from "@/data/models";
import { Breeds, Species } from "@/data/sample";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
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

const AddConsultation = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();

  const [date, setDate] = useState(new Date(1598051730000));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedName, setSelectedName] = useState<string>();
  const [selectedSex, setSelectedSex] = useState<string>();
  const [selectedBreed, setSelectedBreed] = useState<BreedModel>();
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesModel>();
  const [selectedColor, setSelectedColor] = useState<string>();
  const [selectedNeutered, setSelectedNeutered] = useState<string>();
  const [selectedWeight, setSelectedWeight] = useState<string>();

  const [breedsToChoose, setBreedsToChoose] = useState<BreedModel[]>();
  const [speciesToChoose, setSpeciesToChoose] = useState<SpeciesModel[]>();
  const [colorsToChoose, setColorsToChoose] = useState<any>();
  const [sexToChoose, setSexToChoose] = useState<any>();

  const [sexModal, setSexModal] = useState(false);
  const [speciesModal, setSpeciesModal] = useState(false);
  const [breedModal, setBreedModal] = useState(false);
  const [colorModal, setColorModal] = useState(false);
  const [neuteredModal, setNeuteredModal] = useState(false);

  const onChange = (event: any, selectedDate: any) => {
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
    }, []),
  );

  useEffect(() => {
    const species = Species;
    const colors = Color;
    const sex = Sex;

    const colorsWithId = Object.entries(colors).map(([colorName], index) => ({
      id: index + 1,
      Name: colorName,
    }));

    const sexWithId = Object.entries(sex).map(([sexName], index) => ({
      id: index + 1,
      Name: sexName,
    }));

    setSpeciesToChoose(species);
    setColorsToChoose(colorsWithId);
    setSexToChoose(sexWithId);
  }, []);

  // when species changes, reset breeds
  useEffect(() => {
    const breed = Breeds.filter(
      (item) => item.SpeciesId === selectedSpecies?.id,
    );
    setBreedsToChoose(breed);
    setSelectedBreed(undefined);
  }, [selectedSpecies]);

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="" />
      <ScrollView contentContainerStyle={{ alignItems: "center", gap: 10 }}>
        <AdaptiveText style={styles.title}>Add Consultation</AdaptiveText>

        {/* <AdaptiveText style={{ width: "84%", marginBottom: 5 }}>
          Name
        </AdaptiveText>
        <CustomInput
          value={selectedName}
          onChangeText={setSelectedName}
          style={{ width: "84%" }}
          label={"Name"}
        /> */}

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
            mode={"date"}
            onChange={onChange}
          />
        )}
        {Platform.OS === "ios" && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode={"date"}
            onChange={onChange}
          />
        )}

        <AdaptiveText style={{ width: "84%" }}>Description</AdaptiveText>
        <CustomInput style={{ height: 200 }} />

        <TouchableOpacity style={styles.buttonSave}>
          <Text style={styles.btnTextSave}>Save changes</Text>
        </TouchableOpacity>
      </ScrollView>
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
      marginTop: 200,
    },
    btnTextSave: {
      color: colors.white,
      fontFamily: "Poppins-Bold",
      fontSize: 18,
      textAlign: "center",
    },
  });
};
