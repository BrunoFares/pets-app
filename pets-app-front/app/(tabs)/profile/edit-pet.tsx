import { AdaptiveText } from "@/components/AdaptiveText";
import CustomInput from "@/components/CustomInput";
import ListWithoutConfirmationModal from "@/components/ListWithoutConfirmationModal";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Pet = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });

  const [date, setDate] = useState(new Date(1598051730000));
  const [selectedSex, setSelectedSex] = useState<string>();
  const [selectedBreed, setSelectedBreed] = useState<string>();
  const [selectedSpecies, setSelectedSpecies] = useState<string>();
  const [selectedColor, setSelectedColor] = useState<string>();

  const [sexModal, setSexModal] = useState(false);
  const [speciesModal, setSpeciesModal] = useState(false);
  const [breedModal, setBreedModal] = useState(false);
  const [colorModal, setColorModal] = useState(false);

  const onChange = (event: any, selectedDate: any) => {
    const currentDate = selectedDate;
    setDate(currentDate);
  };

  const petSex = [
    {
      id: 1,
      name: "Male",
    },
    {
      id: 2,
      name: "Female",
    },
  ];

  // TODO: replace with API call to database
  const petBreeds = [
    {
      id: 1,
      name: "Siamese",
    },
    {
      id: 2,
      name: "British Shorthair",
    },
    {
      id: 3,
      name: "Maine Coon",
    },
    {
      id: 4,
      name: "Persian",
    },
    {
      id: 5,
      name: "Ragdoll",
    },
  ];

  const petColors = [
    {
      id: 1,
      name: "Calico",
    },
    {
      id: 2,
      name: "Orange",
    },
    {
      id: 3,
      name: "Black",
    },
    {
      id: 4,
      name: "White",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="" />
      <ScrollView contentContainerStyle={{alignItems: 'center', gap: 10}}>
        <AdaptiveText style={styles.title}>Edit pet details</AdaptiveText>

        <AdaptiveText style={{width: '84%'}}>Name</AdaptiveText>
        <CustomInput label={"Name"} />

        <AdaptiveText style={{width: '84%'}}>Date of Birth</AdaptiveText>
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={"date"}
          onChange={onChange}
          style={{ marginBottom: 10 }}
        />

        <AdaptiveText style={{width: '84%'}}>Species</AdaptiveText>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => {
            setSpeciesModal(true);
          }}
        >
          <AdaptiveText style={styles.textPicker}>
            {selectedSpecies || "Select species..."}
          </AdaptiveText>
          <AntDesign
            name="down"
            size={10}
            style={{ paddingRight: 16 }}
            color={darkMode ? colors.white : colors.veryDarkGrey}
          />
        </TouchableOpacity>

        <AdaptiveText style={{width: '84%'}}>Species</AdaptiveText>
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

        <AdaptiveText style={{width: '84%'}}>Species</AdaptiveText>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => {
            setBreedModal(true);
          }}
        >
          <AdaptiveText style={styles.textPicker}>
            {selectedBreed || "Select breed..."}
          </AdaptiveText>
          <AntDesign
            name="down"
            size={10}
            style={{ paddingRight: 16 }}
            color={darkMode ? colors.white : colors.veryDarkGrey}
          />
        </TouchableOpacity>

        <AdaptiveText style={{width: '84%'}}>Species</AdaptiveText>
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
        listElements={[
          { id: 1, name: "Dog" },
          { id: 2, name: "Cat" },
        ]}
        visible={speciesModal}
        onClose={() => {
          setSpeciesModal(false);
        }}
        onDone={(val: string) => {
          setSpeciesModal(false);
          setSelectedSpecies(val);
        }}
      />

      <ListWithoutConfirmationModal
        title={"Select the sex of the pet"}
        listElements={petSex}
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
        listElements={petBreeds}
        visible={breedModal}
        onClose={() => {
          setBreedModal(false);
        }}
        onDone={(val: string) => {
          setBreedModal(false);
          setSelectedBreed(val);
        }}
      />

      <ListWithoutConfirmationModal
        title={"Select the color of the pet"}
        listElements={petColors}
        visible={colorModal}
        onClose={() => {
          setColorModal(false);
        }}
        onDone={(val: string) => {
          setColorModal(false);
          setSelectedColor(val);
        }}
      />
    </SafeAreaView>
  );
};

export default Pet;

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
      marginBottom: '30%',
      marginTop: 20
    },
    btnTextSave: {
      color: colors.white,
      fontFamily: 'Poppins-Bold',
      fontSize: 18,
      textAlign: 'center',
    }
  });
};
