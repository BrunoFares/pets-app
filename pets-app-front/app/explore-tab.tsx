import { AdaptiveView } from "@/components/AdaptiveView";
import ShopItem from "@/components/shop-item";
import { colors } from "@/constants/colors";
import { FontAwesome, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";

const ExploreTab = ({ items }: any) => {
    const darkMode = useColorScheme() === 'dark';
    const styles = createStyles({ darkMode });

    items = [
        {
            key: 1,
            name: 'Dr. Abou Breiss',
            location: 'Hamra, Beirut',
            rating: 3.8,
            image: ''
        },
        {
            key: 2,
            name: 'Kalinka & Minouche Ta3awouniye',
            location: 'Mansourieh, Mount Lebanon',
            rating: 4.8,
            image: ''
        },
        {
            key: 3,
            name: 'Diddy Kong',
            location: 'New Sehaileh, Mount Lebanon',
            rating: 5.0,
            image: ''
        },
        {
            key: 4,
            name: 'Dr. Amara ya amara la totla3i aal shajara',
            location: 'Ajaltoun, Mount Lebanon',
            rating: 0.3,
            image: ''
        },
    ]

    const [displayedItems, setDisplayedItems] = useState(items);

    const searchItems = (prompt: string) => {
        const display = items.filter((item: any) => {
            return item.name.toLowerCase().includes(prompt.toLowerCase())
        })
        setDisplayedItems(display);
    }

    const filterItems = () => {}

    const sortItems = () => {}
    
    return (
        <AdaptiveView style={{flex: 1, alignItems: "center", justifyContent: "center",}}>
            <View style={styles.utilityBar}>
                <TouchableOpacity>
                    <FontAwesome6 name="filter" size={24} color={darkMode ? colors.white : colors.black} />
                </TouchableOpacity>

                <TouchableOpacity>
                    <MaterialIcons name="sort" size={24} color={darkMode ? colors.white : colors.black} />
                </TouchableOpacity>
                
                <TextInput onChangeText={searchItems} style={styles.textInput} placeholder="Search for vet clinics" />

                <TouchableOpacity>
                    <FontAwesome name="search" size={24} color={darkMode ? colors.white : colors.black} />
                </TouchableOpacity>
            </View>
            <ScrollView style={{width: '100%', marginTop: 15}}>
                {
                    displayedItems ? displayedItems.map((item: any) => {
                        return (
                            <ShopItem
                                key={item.key}
                                name={item.name}
                                location={item.location}
                                rating={item.rating}
                                image={item.image}
                            />
                        );
                    }) 
                    :
                    <Text style={{
                        color: darkMode ? colors.white : colors.black, 
                        fontFamily: 'Poppins-SemiBold',
                        alignSelf: 'center',
                        marginTop: 250
                    }}>No Items found.</Text>
                }
            </ScrollView>
        </AdaptiveView>
    )
};

const createStyles = ({ darkMode }: any) => {
    return StyleSheet.create({
        utilityBar: {
            flexDirection: 'row',
            marginTop: 15,
            gap: 10,
            alignItems: 'center'
        },
        textInput: {
            height: 40,
            paddingHorizontal: 10,
            fontSize: 16,
            width: '60%',
            color: darkMode ? colors.white : colors.black,
            fontFamily: "Poppins-Regular",
            backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
            borderRadius: 20,
            paddingLeft: 15
        },
    })
}

export default ExploreTab;