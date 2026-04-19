import { AdaptiveText } from "@/components/AdaptiveText";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { ConsultationModel, PetModel, VetModel } from "@/data/models";
import { Vets } from "@/data/sample";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Consultation = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();
  const { payload } = useLocalSearchParams<{ payload?: any }>();
  const [consultation, setConsultation] = useState<ConsultationModel>();
  const [pet, setPet] = useState<PetModel>();
  const [vet, setVet] = useState<VetModel>();

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

    const temp = Vets.find((item) => item.Id === parsed.item.VetId);

    setVet(temp);
    setPet(parsed.pet);
    setConsultation(parsed.item);
  }, [payload]);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);

      return () => {
        setShowFooter?.(true);
      };
    }, []),
  );

  if (consultation) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader title="" />
        <ScrollView contentContainerStyle={styles.container}>
          <AdaptiveText style={styles.title}>
            {pet?.Name}'s Consultation
          </AdaptiveText>

          <AdaptiveText
            style={{
              fontFamily: "Poppins-Light",
              alignSelf: "center",
              top: -10,
            }}
          >
            {consultation.Date}
          </AdaptiveText>

          <AdaptiveText style={styles.sectionTitle}>
            Details provided by {consultation.VetId}:
          </AdaptiveText>
          <AdaptiveText style={{ marginHorizontal: "7%", fontSize: 17 }}>
            {consultation.Details}
          </AdaptiveText>
        </ScrollView>
      </SafeAreaView>
    );
  } else;
};

export default Consultation;

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
    },
    sectionTitle: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 18,
      marginHorizontal: "7%",
    },
  });
};
