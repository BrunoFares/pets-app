import { AdaptiveText } from "@/components/AdaptiveText";
import CustomImage from "@/components/CustomImage";
import CustomInput from "@/components/CustomInput";
import ListWithoutConfirmationModal from "@/components/ListWithoutConfirmationModal";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthProvider";
import { useGlobal } from "@/contexts/GlobalProvider";
import { BreedModel, Color, PetModel, Sex, SpeciesModel } from "@/data/models";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { presentApiError } from "@/lib/api-feedback";
import { apiRequest } from "@/lib/api";
import {
  fetchBreedOptions,
  fetchPetById,
  fetchSpeciesOptions,
  parseRoutePayload,
  toApiPetColor,
  toApiPetSex,
  uploadPetAvatar,
} from "@/lib/profile-api";
import { AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EditPet = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();
  const { refreshProfile } = useAuth();
  const router = useRouter();
  const { payload } = useLocalSearchParams<{ payload?: any }>();

  const [petId, setPetId] = useState<string>();
  const [petImage, setPetImage] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPet, setIsLoadingPet] = useState(true);
  const [isLoadingSpecies, setIsLoadingSpecies] = useState(true);
  const [isLoadingBreeds, setIsLoadingBreeds] = useState(false);

  const [selectedName, setSelectedName] = useState("");
  const [selectedSex, setSelectedSex] = useState("");
  const [selectedBreed, setSelectedBreed] = useState<BreedModel>();
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesModel>();
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedNeutered, setSelectedNeutered] = useState("");
  const [selectedWeight, setSelectedWeight] = useState("");
  const [selectedImageAsset, setSelectedImageAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [breedsToChoose, setBreedsToChoose] = useState<BreedModel[]>([]);
  const [speciesToChoose, setSpeciesToChoose] = useState<SpeciesModel[]>([]);

  const [sexModal, setSexModal] = useState(false);
  const [speciesModal, setSpeciesModal] = useState(false);
  const [breedModal, setBreedModal] = useState(false);
  const [colorModal, setColorModal] = useState(false);
  const [neuteredModal, setNeuteredModal] = useState(false);
  const isLoading =
    isSubmitting || isLoadingPet || isLoadingSpecies || isLoadingBreeds;

  const colorsToChoose = useMemo(
    () =>
      Object.values(Color).map((value, index) => ({
        id: index + 1,
        Name: value,
      })),
    [],
  );

  const sexToChoose = useMemo(
    () =>
      Object.values(Sex).map((value, index) => ({
        id: index + 1,
        Name: value,
      })),
    [],
  );

  const onChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const loadPet = useCallback(async (id: string) => {
    setIsLoadingPet(true);

    try {
      const pet = await fetchPetById(id);

      setSelectedName(pet.Name);
      setSelectedSex(pet.Sex);
      setSelectedColor(String(pet.Color));
      setSelectedNeutered(pet.Neutered ? "Yes" : "No");
      setSelectedWeight(pet.WeightKg ? String(pet.WeightKg) : "");
      setPetImage(pet.AvatarUrl ?? null);

      if (pet.BirthDate) {
        const parsedDate = new Date(pet.BirthDate);
        if (!Number.isNaN(parsedDate.getTime())) {
          setDate(parsedDate);
        }
      }
    } catch (error) {
      presentApiError("Unable to load pet", error);
    } finally {
      setIsLoadingPet(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);

      if (petId) {
        void loadPet(petId);
      }

      return () => {
        setShowFooter?.(true);
      };
    }, [loadPet, petId, setShowFooter]),
  );

  const loadSpecies = useCallback(async () => {
    setIsLoadingSpecies(true);

    try {
      const species = await fetchSpeciesOptions();
      setSpeciesToChoose(species);
    } catch (error) {
      presentApiError("Unable to load pet details", error);
    } finally {
      setIsLoadingSpecies(false);
    }
  }, []);

  useEffect(() => {
    void loadSpecies();
  }, [loadSpecies]);

  useEffect(() => {
    const parsed = parseRoutePayload<{ pet?: PetModel }>(payload);
    if (!parsed?.pet) {
      setPetId(undefined);
      setIsLoadingPet(false);
      return;
    }

    setPetId(String(parsed.pet.Id));
    setSelectedName(parsed.pet.Name);
    setSelectedSex(parsed.pet.Sex);
    setSelectedColor(String(parsed.pet.Color));
    setSelectedNeutered(parsed.pet.Neutered ? "Yes" : "No");
    setSelectedWeight(parsed.pet.WeightKg ? String(parsed.pet.WeightKg) : "");
    setPetImage(parsed.pet.AvatarUrl ?? null);

    if (parsed.pet.BirthDate) {
      const parsedDate = new Date(parsed.pet.BirthDate);
      if (!Number.isNaN(parsedDate.getTime())) {
        setDate(parsedDate);
      }
    }

    setIsLoadingPet(true);
  }, [payload]);

  useEffect(() => {
    if (!speciesToChoose.length) {
      return;
    }

    const parsed = parseRoutePayload<{ pet?: PetModel }>(payload);
    if (!parsed?.pet?.SpeciesId) {
      return;
    }

    const matchingSpecies = speciesToChoose.find(
      (item) => Number(item.id) === Number(parsed.pet?.SpeciesId),
    );

    if (matchingSpecies) {
      setSelectedSpecies(matchingSpecies);
    }
  }, [payload, speciesToChoose]);

  const loadBreeds = useCallback(async (speciesId?: number | null) => {
    if (!speciesId) {
      setBreedsToChoose([]);
      setSelectedBreed(undefined);
      setIsLoadingBreeds(false);
      return;
    }

    setIsLoadingBreeds(true);

    try {
      const breeds = await fetchBreedOptions(speciesId);
      setBreedsToChoose(breeds);

      const parsed = parseRoutePayload<{ pet?: PetModel }>(payload);
      const currentBreedId = parsed?.pet?.BreedId;

      if (currentBreedId) {
        const matchingBreed = breeds.find(
          (item) => Number(item.id) === Number(currentBreedId),
        );
        setSelectedBreed(matchingBreed);
      } else {
        setSelectedBreed(undefined);
      }
    } catch (error) {
      presentApiError("Unable to load breeds", error);
    } finally {
      setIsLoadingBreeds(false);
    }
  }, [payload]);

  useEffect(() => {
    void loadBreeds(selectedSpecies?.id ? Number(selectedSpecies.id) : null);
  }, [loadBreeds, selectedSpecies]);

  const { isRefreshing, onRefresh } = usePullToRefresh(
    useCallback(async () => {
      await Promise.all([
        loadSpecies(),
        petId ? loadPet(petId) : Promise.resolve(),
      ]);
      await loadBreeds(selectedSpecies?.id ? Number(selectedSpecies.id) : null);
    }, [loadBreeds, loadPet, loadSpecies, petId, selectedSpecies]),
  );
  const showLoadingOverlay = isLoading && !isRefreshing;

  const handleSave = async () => {
    if (!petId) {
      Alert.alert("Pet unavailable", "We couldn't determine which pet to update.");
      return;
    }

    if (!selectedName.trim()) {
      Alert.alert("Missing information", "Please enter your pet's name.");
      return;
    }

    if (!selectedSpecies) {
      Alert.alert("Missing information", "Please select your pet's species.");
      return;
    }

    if (!selectedSex) {
      Alert.alert("Missing information", "Please select your pet's sex.");
      return;
    }

    if (!selectedColor) {
      Alert.alert("Missing information", "Please select your pet's color.");
      return;
    }

    if (!selectedNeutered) {
      Alert.alert(
        "Missing information",
        "Please tell us whether your pet is neutered.",
      );
      return;
    }

    const trimmedWeight = selectedWeight.trim();
    const parsedWeight =
      trimmedWeight.length > 0 ? Number(trimmedWeight) : null;
    const isInvalidWeight =
      trimmedWeight.length > 0 &&
      (parsedWeight === null || !Number.isFinite(parsedWeight) || parsedWeight < 0);

    if (isInvalidWeight) {
      Alert.alert("Invalid weight", "Please enter a valid weight in kilograms.");
      return;
    }

    try {
      setIsSubmitting(true);

      await apiRequest(`/api/Pets/${petId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: selectedName.trim(),
          speciesId: Number(selectedSpecies.id),
          breedId: selectedBreed ? Number(selectedBreed.id) : null,
          sex: toApiPetSex(selectedSex),
          birthDate: date.toISOString(),
          weightKg: parsedWeight,
          color: toApiPetColor(selectedColor),
          neutered: selectedNeutered === "Yes",
          notes: null,
        }),
      });

      if (selectedImageAsset) {
        await uploadPetAvatar(petId, selectedImageAsset);
      }

      await refreshProfile();
      router.back();
    } catch (error) {
      presentApiError("Unable to update pet", error, {
        networkMessage:
          "We couldn't reach the server, so your pet changes were not saved.",
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
        <AdaptiveText style={styles.title}>Edit pet details</AdaptiveText>

        <View
          style={{
            flexDirection: "row",
            width: "85%",
            gap: 20,
            marginTop: 20,
          }}
        >
          <View>
            <CustomImage
              image={petImage}
              withEdits
              onImageSelected={setSelectedImageAsset}
            />
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
          </View>
        </View>

        <AdaptiveText style={{ width: "84%" }}>Species</AdaptiveText>
        <TouchableOpacity style={styles.picker} onPress={() => setSpeciesModal(true)}>
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
            <TouchableOpacity style={styles.picker} onPress={() => setBreedModal(true)}>
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
        <TouchableOpacity style={styles.picker} onPress={() => setSexModal(true)}>
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
          onPress={() => setNeuteredModal(true)}
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

        <AdaptiveText style={{ width: "84%" }}>Weight (Kg)</AdaptiveText>
        <CustomInput
          value={selectedWeight}
          onChangeText={setSelectedWeight}
          keyboardType="decimal-pad"
          style={{ width: "84%" }}
        />

        <AdaptiveText style={{ width: "84%" }}>Color</AdaptiveText>
        <TouchableOpacity style={styles.picker} onPress={() => setColorModal(true)}>
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
        title="Select the species of the pet"
        listElements={speciesToChoose}
        visible={speciesModal}
        onClose={() => setSpeciesModal(false)}
        onDone={(val: SpeciesModel) => {
          setSpeciesModal(false);
          setSelectedSpecies(val);
        }}
      />

      <ListWithoutConfirmationModal
        title="Select the sex of the pet"
        listElements={sexToChoose}
        visible={sexModal}
        onClose={() => setSexModal(false)}
        onDone={(val: { Name: string }) => {
          setSexModal(false);
          setSelectedSex(val.Name);
        }}
      />

      <ListWithoutConfirmationModal
        title="Select the breed of the pet"
        listElements={breedsToChoose}
        visible={breedModal}
        onClose={() => setBreedModal(false)}
        onDone={(val: BreedModel) => {
          setBreedModal(false);
          setSelectedBreed(val);
        }}
      />

      <ListWithoutConfirmationModal
        title="Select the color of the pet"
        listElements={colorsToChoose}
        visible={colorModal}
        onClose={() => setColorModal(false)}
        onDone={(val: { Name: string }) => {
          setColorModal(false);
          setSelectedColor(val.Name);
        }}
      />

      <ListWithoutConfirmationModal
        title="Is your pet neutered?"
        listElements={[
          { id: 1, Name: "Yes" },
          { id: 2, Name: "No" },
        ]}
        visible={neuteredModal}
        onClose={() => setNeuteredModal(false)}
        onDone={(val: { Name: string }) => {
          setNeuteredModal(false);
          setSelectedNeutered(val.Name);
        }}
      />

      {showLoadingOverlay && <LoadingOverlay />}
    </SafeAreaView>
  );
};

export default EditPet;

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
