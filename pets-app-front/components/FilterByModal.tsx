import { colors } from "@/constants/colors";
import { PlaceFilter } from "@/lib/place-list-utils";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import CustomModal from "./CustomModal";

const FilterByModal = ({
    visible, 
    onClose, 
    onDone,
    selectedFilters = [],
} : {
    visible: boolean; 
    onClose: () => void; 
    onDone: (val: PlaceFilter[]) => void;
    selectedFilters?: PlaceFilter[];
}) => {
    const darkMode = useColorScheme() === 'dark';
    const styles = createStyle({ darkMode });
    const [filters, setFilters] = useState<PlaceFilter[]>(selectedFilters);

    useEffect(() => {
        if (visible) {
            setFilters(selectedFilters);
        }
    }, [selectedFilters, visible]);

    const modifyFilters = (value: PlaceFilter) => {
        if (!filters.includes(value))
            setFilters(prevStrings => [...prevStrings, value]);
        else
            setFilters(prevStrings => prevStrings.filter(s => s !== value));
    }

    return (
        <CustomModal visible={visible} onClose={onClose}>
            <Text style={styles.title}>Filter By</Text>
            <View style={styles.container}>
                <TouchableOpacity onPress={() => modifyFilters('openToday')}>
                    <Text style={[styles.text, filters.includes('openToday') && {fontFamily: 'Poppins-Bold'}]}>Open Today</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => modifyFilters('highlyRated')}>
                    <Text style={[styles.text, filters.includes('highlyRated') && {fontFamily: 'Poppins-Bold'}]}>Rated 4+ Stars</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => modifyFilters('reviewed')}>
                    <Text style={[styles.text, filters.includes('reviewed') && {fontFamily: 'Poppins-Bold'}]}>Has Reviews</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => {
                    setFilters([]);
                    onDone([]);
                    onClose();
                }}>
                    <Text style={[styles.btnText, styles.secondaryBtnText]}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => {
                    onDone(filters);
                    onClose();
                }}>
                    <Text style={styles.btnText}>Done</Text>
                </TouchableOpacity>
            </View>
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
            paddingHorizontal: 36,
            borderRadius: 20
        },
        secondaryButton: {
            backgroundColor: darkMode ? colors.averageDarkGrey : colors.lightGrey,
        },
        btnText: {
            color: colors.white,
            fontFamily: 'Poppins-Bold',
            fontSize: 18
        },
        secondaryBtnText: {
            color: darkMode ? colors.white : colors.black,
        },
        actions: {
            flexDirection: "row",
            gap: 12,
        }
    });
}
