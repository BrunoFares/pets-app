import { colors } from "@/constants/colors";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import CustomModal from "./CustomModal";

const FilterByModal = ({
    visible, 
    onClose, 
    onDone
} : {
    visible: boolean; 
    onClose: () => void; 
    onDone: (val: string[]) => void
}) => {
    const darkMode = useColorScheme() === 'dark';
    const styles = createStyle({ darkMode });
    const [sortingMethod, setSortingMethod] = useState<string[]>([]);

    const modifySortingMethod = (value: string) => {
        if (!sortingMethod.includes(value))
            setSortingMethod(prevStrings => [...prevStrings, value]);
        else
            setSortingMethod(prevStrings => prevStrings.filter(s => s !== value));
    }

    return (
        <CustomModal visible={visible} onClose={onClose}>
            <Text style={styles.title}>Filter By</Text>
            <View style={styles.container}>
                <TouchableOpacity onPress={() => modifySortingMethod('popular')}>
                    <Text style={[styles.text, sortingMethod.includes('popular') && {fontFamily: 'Poppins-Bold'}]}>Most Popular</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => modifySortingMethod('atoz')}>
                    <Text style={[styles.text, sortingMethod.includes('atoz') && {fontFamily: 'Poppins-Bold'}]}>Alphabetically (A to Z)</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => modifySortingMethod('ztoa')}>
                    <Text style={[styles.text, sortingMethod.includes('ztoa') && {fontFamily: 'Poppins-Bold'}]}>Alphabetically (Z to A)</Text>
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

export default FilterByModal;

const createStyle = ({ darkMode }: any) => {
    return StyleSheet.create({
        container: {
            marginTop: 30,
            marginBottom: 40,
            gap: 20,
            width: 300,
            alignSelf: 'center',
        },
        title: {
            color: darkMode ? colors.white : colors.black,
            fontFamily: 'Poppins-Bold',
            fontSize: 26
        },
        text: {
            color: darkMode ? colors.white : colors.black,
            fontFamily: 'Poppins-Light',
            fontSize: 18,
            textAlign: 'center',
            height: 25
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