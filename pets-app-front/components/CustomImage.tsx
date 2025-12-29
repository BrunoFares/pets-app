import { colors } from "@/constants/colors";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

const CustomImage = ({ customStyles, image }: any) => {
  const styles = createStyles();
  return (
    <View style={[styles.pfp, customStyles]}>
      {image ? <Image source={image} style={customStyles} /> : <View style={customStyles} />}
    </View>
  );
};

export default CustomImage;

const createStyles = () => {
  return StyleSheet.create({
    pfp: {
      height: 120,
      width: 120,
      borderRadius: 120,
      backgroundColor: colors.lightGrey,
    },
  });
};
