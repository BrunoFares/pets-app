import { AdaptiveView } from "@/components/AdaptiveView";
import ShopItem from "@/components/shop-item";
import { colors } from "@/constants/colors";
import { FontAwesome, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";

const VetsTab = () => {
    const darkMode = useColorScheme() === 'dark';
    const styles = createStyles({ darkMode });
    
    return (
        <AdaptiveView style={{flex: 1, alignItems: "center", justifyContent: "center",}}>
            <View style={styles.utilityBar}>
                <View style={{width: '65%'}} />
                <TouchableOpacity>
                    <FontAwesome6 name="filter" size={24} color={darkMode ? colors.white : colors.black} />
                </TouchableOpacity>

                <TouchableOpacity>
                    <MaterialIcons name="sort" size={24} color={darkMode ? colors.white : colors.black} />
                </TouchableOpacity>
                
                <TouchableOpacity>
                    <FontAwesome name="search" size={24} color={darkMode ? colors.white : colors.black} />
                </TouchableOpacity>
            </View>
            <ScrollView style={{width: '100%', marginTop: 15}}>
                <ShopItem
                    name='Dr. Abou Breiss'
                    location='Hamra, Beirut'
                    rating={3.8}
                    image={''}
                />
                <ShopItem 
                    name='Kalinka & Minouche Ta3awouniye'
                    location='Mansourieh, Mount Lebanon'
                    rating={4.8}
                    image={''}
                />
                <ShopItem 
                    name='Diddy Kong'
                    location='New Sehaileh, Mount Lebanon'
                    rating={5.0}
                    image={''}
                />
                <ShopItem 
                    name='Dr. Amara ya amara la totla3i aal shajara'
                    location='Ajaltoun, Mount Lebanon'
                    rating={0.3}
                    image={''}
                />
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
        }
    })
}

export default VetsTab;