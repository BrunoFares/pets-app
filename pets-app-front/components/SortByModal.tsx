import { colors } from "@/constants/colors";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import CustomModal from "./CustomModal";

const SortByModal = ({
    visible, 
    onClose, 
    onDone
} : {
    visible: boolean; 
    onClose: () => void; 
    onDone: (val: string) => void
}) => {
    const darkMode = useColorScheme() === 'dark';
    const styles = createStyle({ darkMode });
    const [sortingMethod, setSortingMethod] = useState('popular');

    return (
        <CustomModal visible={visible} onClose={onClose}>
            <Text style={styles.title}>Sort By</Text>
            <View style={styles.container}>
                <TouchableOpacity onPress={() => setSortingMethod('popular')}>
                    <Text style={[styles.text, sortingMethod === 'popular' && {fontFamily: 'Poppins-Bold'}]}>Most Popular</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setSortingMethod('atoz')}>
                    <Text style={[styles.text, sortingMethod === 'atoz' && {fontFamily: 'Poppins-Bold'}]}>Alphabetically (A to Z)</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setSortingMethod('ztoa')}>
                    <Text style={[styles.text, sortingMethod === 'ztoa' && {fontFamily: 'Poppins-Bold'}]}>Alphabetically (Z to A)</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.button} onPress={() => {
                onDone(sortingMethod);
                onClose();
            }}>
                <Text style={styles.btnText}>Done</Text>
            </TouchableOpacity>
        </CustomModal>
    )
}

const createStyle = ({ darkMode }: any) => {
    return StyleSheet.create({
        container: {
            marginTop: 30,
            marginBottom: 40,
            gap: 10,
            width: 300,
            alignSelf: 'center',
        },
        title: {
            color: darkMode ? colors.white : colors.black,
            fontFamily: 'Poppins-Bold',
            fontSize: 28
        },
        text: {
            color: darkMode ? colors.white : colors.black,
            fontFamily: 'Poppins-Light',
            fontSize: 18,
            textAlign: 'center',
        },
        button: {
            marginBottom: 40,
            backgroundColor: colors.green,
            paddingVertical: 20,
            paddingHorizontal: 80,
            borderRadius: 20
        },
        btnText: {
            color: colors.white,
            fontFamily: 'Poppins-Bold',
            fontSize: 18
        }
    });
}

export default SortByModal;