import { colors } from "@/constants/colors";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";

export const Header = () => {
    return (
        <View style={styles.header}>
            <Image source={require('@/assets/images/petsapp-logo-dark.png')} style={{height: 80, width: 80}} />
        </View>
    )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.green,
    borderRadius: 30,
    width: '94%',
    alignSelf: 'center',
    // marginTop: Platform.select({
    //   ios: 0,
    //   android: 30
    // }),

    // shadow
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 10},
    shadowRadius: 10,
    shadowOpacity: 0.2,
    elevation: 8
  },
  icon: {
    marginRight: 12,
  },
});