import { useGlobal } from "@/contexts/GlobalProvider";
import React from "react";
import { StyleSheet, useColorScheme } from "react-native";

const Consultation = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { setShowFooter } = useGlobal();

  return <></>;
};

export default Consultation;

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({});
};
