import { colors } from "@/constants/colors";
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import CustomModal from "./CustomModal";

const LogOutModal = ({
    visible, 
    onClose, 
    onDone
} : {
    visible: boolean; 
    onClose: () => void; 
    onDone: () => void
}) => {
    const darkMode = useColorScheme() === 'dark';
    const styles = createStyle({ darkMode });

    return (
        <CustomModal visible={visible} onClose={onClose}>
            <Text style={styles.title}>Do you want to log out of your account?</Text>

            <View style={styles.buttons}>
                <TouchableOpacity style={styles.buttonYes} onPress={onDone}>
                    <Text style={styles.btnTextYes}>Yes</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.buttonNo} onPress={onClose}>
                    <Text style={styles.btnTextNo}>No</Text>
                </TouchableOpacity>
            </View>
        </CustomModal>
    )
}

export default LogOutModal;

const createStyle = ({ darkMode }: any) => {
    return StyleSheet.create({
        title: {
            color: darkMode ? colors.white : colors.black,
            fontFamily: 'Poppins-Bold',
            fontSize: 26,
            textAlign: 'center',
            marginBottom: 20
        },
        buttons: {
            marginBottom: 40,
            gap: 10,
            width: '100%',
            alignItems: 'center'
        },
        buttonYes: {
            backgroundColor: colors.red,
            paddingVertical: 20,
            paddingHorizontal: 80,
            borderRadius: 20,
            width: '90%'
        },
        btnTextYes: {
            color: colors.white,
            fontFamily: 'Poppins-Bold',
            fontSize: 18,
            textAlign: 'center'
        },
        buttonNo: {
            backgroundColor: darkMode ? colors.mildDarkGrey : colors.lightGrey,
            paddingVertical: 20,
            paddingHorizontal: 80,
            borderRadius: 20,
            width: '90%'
        },
        btnTextNo: {
            color: darkMode ? colors.white : colors.black,
            fontFamily: 'Poppins-Bold',
            fontSize: 18,
            textAlign: 'center',
        }
    });
}