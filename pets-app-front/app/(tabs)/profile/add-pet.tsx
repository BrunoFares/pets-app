import { AdaptiveText } from "@/components/AdaptiveText";
import CustomImage from "@/components/CustomImage";
import CustomInput from "@/components/CustomInput";
import ListWithoutConfirmationModal from "@/components/ListWithoutConfirmationModal";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { BreedModel, Color, Sex, SpeciesModel } from "@/data/models";
import { Breeds, Species } from "@/data/sample";
import { AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AddPet = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();
  const router = useRouter();

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
        <AdaptiveText style={styles.title}>Add Pet</AdaptiveText>

        <View
          style={{
            flexDirection: "row",
            width: "85%",
            gap: 20,
            marginTop: 20,
          }}
        >
          <View>
            <CustomImage withEdits={true} />
          </View>
          <View
            style={{
              width: 200,
              alignItems: "center",
            }}
          >
            <AdaptiveText style={{ width: "100%", marginBottom: 5 }}>
              Name
            </AdaptiveText>
            <CustomInput
              value={selectedName}
              onChangeText={setSelectedName}
              style={{ width: "100%" }}
              label={"Name"}
            />

            <AdaptiveText style={{ width: "100%", marginBottom: 5 }}>
              Date of Birth
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
          </View>
        </View>

        <AdaptiveText style={{ width: "84%" }}>Species</AdaptiveText>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => {
            setSpeciesModal(true);
          }}
        >
          <AdaptiveText style={styles.textPicker}>
            {selectedSpecies?.Name || "Select species..."}
          </AdaptiveText>
          <AntDesign
            name="down"
            size={10}
            style={{ paddingRight: 16 }}
            color={darkMode ? colors.white : colors.veryDarkGrey}
          />
        </TouchableOpacity>

        {selectedSpecies && (
          <>
            <AdaptiveText style={{ width: "84%" }}>Breed</AdaptiveText>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => {
                setBreedModal(true);
              }}
            >
              <AdaptiveText style={styles.textPicker}>
                {selectedBreed?.Name || "Select breed..."}
              </AdaptiveText>
              <AntDesign
                name="down"
                size={10}
                style={{ paddingRight: 16 }}
                color={darkMode ? colors.white : colors.veryDarkGrey}
              />
            </TouchableOpacity>
          </>
        )}

        <AdaptiveText style={{ width: "84%" }}>Sex</AdaptiveText>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => {
            setSexModal(true);
          }}
        >
          <AdaptiveText style={styles.textPicker}>
            {selectedSex || "Select sex..."}
          </AdaptiveText>
          <AntDesign
            name="down"
            size={10}
            style={{ paddingRight: 16 }}
            color={darkMode ? colors.white : colors.veryDarkGrey}
          />
        </TouchableOpacity>

        <AdaptiveText style={{ width: "84%" }}>Neutered</AdaptiveText>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => {
            setNeuteredModal(true);
          }}
        >
          <AdaptiveText style={styles.textPicker}>
            {selectedNeutered || "Select neutered..."}
          </AdaptiveText>
          <AntDesign
            name="down"
            size={10}
            style={{ paddingRight: 16 }}
            color={darkMode ? colors.white : colors.veryDarkGrey}
          />
        </TouchableOpacity>

        <AdaptiveText style={{ width: "84%" }}>Weight</AdaptiveText>
        <CustomInput
          value={selectedWeight}
          onChangeText={setSelectedWeight}
          style={{ width: "84%" }}
          label={"Weight"}
        />

        <AdaptiveText style={{ width: "84%" }}>Color</AdaptiveText>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => {
            setColorModal(true);
          }}
        >
          <AdaptiveText style={styles.textPicker}>
            {selectedColor || "Select color..."}
          </AdaptiveText>
          <AntDesign
            name="down"
            size={10}
            style={{ paddingRight: 16 }}
            color={darkMode ? colors.white : colors.veryDarkGrey}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonSave}>
          <Text style={styles.btnTextSave}>Save changes</Text>
        </TouchableOpacity>
      </ScrollView>

      <ListWithoutConfirmationModal
        title={"Select the species of the pet"}
        listElements={speciesToChoose}
        visible={speciesModal}
        onClose={() => {
          setSpeciesModal(false);
        }}
        onDone={(val: any) => {
          setSpeciesModal(false);
          setSelectedSpecies(val);
        }}
      />

      <ListWithoutConfirmationModal
        title={"Select the sex of the pet"}
        listElements={sexToChoose}
        visible={sexModal}
        onClose={() => {
          setSexModal(false);
        }}
        onDone={(val: string) => {
          setSexModal(false);
          setSelectedSex(val);
        }}
      />

      <ListWithoutConfirmationModal
        title={"Select the breed of the pet"}
        listElements={breedsToChoose}
        visible={breedModal}
        onClose={() => {
          setBreedModal(false);
        }}
        onDone={(val: any) => {
          setBreedModal(false);
          setSelectedBreed(val);
        }}
      />

      <ListWithoutConfirmationModal
        title={"Select the color of the pet"}
        listElements={colorsToChoose}
        visible={colorModal}
        onClose={() => {
          setColorModal(false);
        }}
        onDone={(val: any) => {
          setColorModal(false);
          setSelectedColor(val);
        }}
      />

      <ListWithoutConfirmationModal
        title={"Is your pet neutered?"}
        listElements={[
          { id: 1, name: "Yes" },
          { id: 2, name: "No" },
        ]}
        visible={neuteredModal}
        onClose={() => {
          setNeuteredModal(false);
        }}
        onDone={(val: any) => {
          setNeuteredModal(false);
          setSelectedNeutered(val);
        }}
      />
    </SafeAreaView>
  );
};

export default AddPet;

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
