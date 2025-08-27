import { AdaptiveView } from "@/components/AdaptiveView";
import ShopItem from "@/components/ShopItem";
import SortByModal from "@/components/SortByModal";
import { colors } from "@/constants/colors";
import { FontAwesome, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";

const ExploreTab = ({ items }: any) => {
    const darkMode = useColorScheme() === 'dark';
    const styles = createStyles({ darkMode });
    const router = useRouter();
    const [sortByModal, setSortByModal] = useState(false);

    items = [
        {
            key: 1,
            name: 'Dr. Abou Breiss',
            location: 'Hamra, Beirut',
            rating: 3.8,
            image: 'Users/brunofares/Desktop/mourinho.jpeg'
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

    const sortItems = (order: string) => {
        switch(order) {
            case 'popular':
                displayedItems.sort((a: any, b: any) => b.rating - a.rating);
                break;
            case 'atoz':
                displayedItems.sort((a: any, b: any) => a.name.localeCompare(b.name));
                break;
            case 'ztoa':
                displayedItems.sort((a: any, b: any) => b.name.localeCompare(a.name));
                break;
            default:
                break;
        }
    }
    
    return (
        <AdaptiveView style={{flex: 1, alignItems: "center", justifyContent: "center",}}>
            <View style={styles.utilityBar}>
                <TouchableOpacity>
                    <FontAwesome6 name="filter" size={24} color={darkMode ? colors.white : colors.black} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setSortByModal(!sortByModal)}>
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
                        const payload = encodeURIComponent(JSON.stringify(item));
                        
                        return (
                            <TouchableOpacity
                                key={item.key}
                                onPress={() => {router.push({ pathname: "/shop/[key]", params: { key: String(item.key), payload } })}}
                            >
                                <ShopItem
                                    key={item.key}
                                    name={item.name}
                                    location={item.location}
                                    rating={item.rating}
                                    image={item.image}
                                />
                            </TouchableOpacity>
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

            <SortByModal visible={sortByModal} onClose={() => setSortByModal(false)} onDone={(value) => sortItems(value)} />
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