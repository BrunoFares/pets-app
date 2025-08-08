import { colors } from "@/constants/colors";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";

export const Header = () => {
    return (
        <View style={styles.header}>
            <Image source={require('@/assets/images/petsapp-logo-dark.png')} style={{height: 80, width: 80}} />
            {/* <View style={styles.actions}>
                <TouchableOpacity onPress={() => alert('Search tapped')}>
                    <Ionicons name="search" size={24} color={colors.white} style={styles.icon} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => alert('Profile tapped')}>
                    <Ionicons name="person-circle" size={28} color={colors.white} />
                </TouchableOpacity>
            </View> */}
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
    width: '100%',
    // height: 70
  },
  // title: {
    // fontSize: 30,
    // color: colors.white,
    // fontFamily: 'Poppins-Bold'
  // },
  // actions: {
  //   flexDirection: 'row',
  // },
  icon: {
    marginRight: 12,
  },
});