import { AdaptiveText } from "@/components/AdaptiveText";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { ConsultationModel, PetModel } from "@/data/models";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { presentApiError } from "@/lib/api-feedback";
import {
  fetchConsultationById,
  parseRoutePayload,
} from "@/lib/profile-api";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Consultation = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();
  const { payload } = useLocalSearchParams<{ payload?: any }>();
  const [consultation, setConsultation] = useState<ConsultationModel>();
  const [pet, setPet] = useState<PetModel>();
  const [consultationId, setConsultationId] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  const loadConsultation = useCallback(async (id: string) => {
    setIsLoading(true);

    try {
      const response = await fetchConsultationById(id);
      setConsultation(response);
    } catch (error) {
      presentApiError("Unable to load consultation", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const parsed = parseRoutePayload<{ item?: ConsultationModel; pet?: PetModel }>(
      payload,
    );
    if (!parsed) {
      setConsultation(undefined);
      setPet(undefined);
      setConsultationId(undefined);
      setIsLoading(false);
      return;
    }

    if (parsed.item) {
      setConsultation({
        ...parsed.item,
        Date:
          parsed.item.Date instanceof Date
            ? parsed.item.Date
            : new Date(parsed.item.Date),
      });
      setConsultationId(String(parsed.item.Id));
      void loadConsultation(String(parsed.item.Id));
    } else {
      setConsultation(undefined);
      setConsultationId(undefined);
      setIsLoading(false);
    }
    setPet(parsed.pet);
  }, [loadConsultation, payload]);

  useFocusEffect(
    useCallback(() => {
      setShowFooter?.(false);

      if (consultationId) {
        void loadConsultation(consultationId);
      }

      return () => {
        setShowFooter?.(true);
      };
    }, [consultationId, loadConsultation, setShowFooter]),
  );

  const { isRefreshing, onRefresh } = usePullToRefresh(
    useCallback(async () => {
      if (consultationId) {
        await loadConsultation(consultationId);
      }
    }, [consultationId, loadConsultation]),
  );
  const showLoadingOverlay = isLoading && !isRefreshing;

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="" />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          !consultation ? styles.emptyStateWrap : null,
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {consultation ? (
          <>
            <AdaptiveText style={styles.title}>
              {`${pet?.Name ?? ""}'s Consultation`}
            </AdaptiveText>

            <AdaptiveText
              style={{
                fontFamily: "Poppins-Light",
                alignSelf: "center",
                top: -10,
              }}
            >
              {consultation.Date.toDateString()}
            </AdaptiveText>

            <AdaptiveText style={styles.sectionTitle}>
              Details provided by{" "}
              {consultation.VetName || consultation.VetId || "your vet"}:
            </AdaptiveText>
            <AdaptiveText style={{ marginHorizontal: "7%", fontSize: 17 }}>
              {consultation.Details}
            </AdaptiveText>
          </>
        ) : (
          <ProfileEmptyState
            title="No consultation details available"
            subtitle="This consultation could not be found or has not been registered yet."
          />
        )}
      </ScrollView>

      {showLoadingOverlay && <LoadingOverlay />}
    </SafeAreaView>
  );
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
    emptyStateWrap: {
      flexGrow: 1,
      justifyContent: "center",
    },
  });
};
