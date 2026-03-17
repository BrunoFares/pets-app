import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { IllnessRecordModel, PetModel } from "@/data/models";
import { IllnessRecords } from "@/data/sample";
import { goTo } from "@/utils";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const IllnessesScreen = () => {
  const router = useRouter();
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();
  const { payload } = useLocalSearchParams<{ payload?: any }>();
  const [pet, setPet] = useState<PetModel>();
  const [illnesses, setIllnesses] = useState<IllnessRecordModel[]>();

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

    setPet(parsed.pet);
    const ill = IllnessRecords.filter((item) => item.petId === parsed.pet.Id);
    setIllnesses(ill);
  }, [payload]);

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

      <AdaptiveText style={styles.title}>Pet's Illness History</AdaptiveText>

      <FlatList
        data={illnesses}
        keyExtractor={(item) => String(item.Id)}
        renderItem={({ item }) => (
          <>
            <TouchableOpacity
              style={{
                alignSelf: "center",
                width: "90%",
                borderColor: colors.darkGrey,
                borderWidth: 1,
                borderRadius: 14,
                paddingVertical: 10,
                paddingHorizontal: 20,
              }}
              onPress={() => {
                goTo({ item }, "/profile/modify-add-illness", router);
              }}
            >
              <AdaptiveText
                style={{ fontFamily: "Poppins-SemiBold", fontSize: 17 }}
              >
                {item.illnessName}
              </AdaptiveText>

              <AdaptiveView
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <AdaptiveView>
                  <AdaptiveText style={styles.datesList}>
                    Diagnosis Date
                  </AdaptiveText>
                  <AdaptiveText style={styles.datesList}>
                    {item.diagnosisDate?.toDateString()}
                  </AdaptiveText>
                </AdaptiveView>

                <AdaptiveView>
                  <AdaptiveText style={styles.datesList}>
                    Cured Date
                  </AdaptiveText>
                  <AdaptiveText style={styles.datesList}>
                    {item.curedDate?.toDateString()}
                  </AdaptiveText>
                </AdaptiveView>
              </AdaptiveView>
            </TouchableOpacity>
          </>
        )}
      />
      <TouchableOpacity
        style={{
          alignSelf: "center",
          backgroundColor: colors.green,
          padding: 14,
          borderRadius: 18,
          marginBottom: 20,
        }}
        onPress={() => {
          goTo("", "/profile/modify-add-illness", router);
        }}
      >
        <Feather
          name="plus"
          size={34}
          color={darkMode ? colors.white : colors.black}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default IllnessesScreen;

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      gap: 10,
    },
    title: {
      fontSize: 26,
      alignSelf: "center",
      fontFamily: "Poppins-SemiBold",
      paddingHorizontal: 10,
      marginBottom: 10,
      textAlign: "center",
    },
    datesList: {
      fontFamily: "Poppins-Light",
      fontSize: 12,
    },
  });
};
