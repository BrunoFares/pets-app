import { colors } from "@/constants/colors"
import { Ionicons } from "@expo/vector-icons"
import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

export const Header = () => {
    return (
        <View style={styles.header}>
            <Text style={styles.title}>Pet Care</Text>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => alert('Search tapped')}>
                    <Ionicons name="search" size={24} color="#fff" style={styles.icon} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => alert('Profile tapped')}>
                    <Ionicons name="person-circle" size={28} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.green,
    width: '100%',
    height: 70
  },
  title: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
  },
  icon: {
    marginRight: 12,
  },
});