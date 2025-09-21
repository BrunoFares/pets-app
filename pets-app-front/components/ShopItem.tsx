import { colors } from "@/constants/colors";
import { Image } from "expo-image";
import { StyleSheet, Text, useColorScheme, View, ViewStyle } from "react-native";

const ShopItem = ({
    name,
    image,
    location,
    rating,
    style
}: {
    name: string;
    image: string;
    location: string;
    rating: string;
    style?: ViewStyle
}) => {
    const darkMode = useColorScheme() === 'dark';
    const styles = createStyles({ darkMode });

    return (
        <View style={[styles.container, style]}>
            {image ? 
                <Image source={image} style={styles.image}/>
            :
                <View style={styles.image} />
            }
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.location}>{location}</Text>
            <Text style={styles.rating}>★ {rating}</Text>
        </View>
    )
};

const createStyles = ({ darkMode }: any) => {
    return StyleSheet.create({
        container: {
            width: '100%',
            backgroundColor: darkMode ? colors.darkGrey : colors.white,
            borderColor: darkMode ? '' : colors.lightGrey,
            borderWidth: darkMode ? 0 : 2,
            borderRadius: 10,
            alignSelf: 'center',
        },
        image: {
            height: 200,
            backgroundColor: colors.lightGrey,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
        },
        name: {
            fontFamily: 'Poppins-Bold',
            color: darkMode ? colors.white : colors.green,
            fontSize: 16,
            marginTop: 10,
            marginLeft: 10,
        },
        location: {
            fontFamily: 'Poppins-Regular',
            color: darkMode ? colors.white : colors.black,
            fontSize: 16,
            marginLeft: 10
        },
        rating: {
            fontFamily: 'Poppins-Regular',
            color: darkMode ? colors.white : colors.black,
            fontSize: 16,
            marginLeft: 10,
            marginBottom: 10
        }
    });
}

export default ShopItem;