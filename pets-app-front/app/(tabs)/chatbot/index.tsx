import { AdaptiveText } from "@/components/AdaptiveText";
import { colors } from "@/constants/colors";
import { useHeaderSlide } from "@/hooks/useHeaderSlide";
import { AntDesign } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Animated, FlatList, StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatbotScreen() {
  const router = useRouter();
  const darkMode = useColorScheme() === 'dark';
  const styles = createStyles({ darkMode });
  const [chats, setChats] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      // API all to get the chats
      const userChats = [
        {key: 1, title: 'firstChat', content: 'content1'},
        {key: 2, title: 'secondChat', content: 'content2'},
        {key: 3, title: 'thirdChat', content: 'content3'},
        {key: 4, title: 'fourthChat', content: 'content4'},
        {key: 5, title: 'fifthChat', content: 'content5'},
      ]
      setChats(userChats);
    }, [])
  )

  const { translateY } = useHeaderSlide({ height: 200, duration: 250 });
  
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        <AdaptiveText style={styles.title}>Dr. Pet</AdaptiveText>
        <AdaptiveText style={styles.subtitle}>Your personal assistant's {'\n'} personal assistant.</AdaptiveText>
      </Animated.View>

      {chats ?
        <FlatList 
          data={chats}
          contentContainerStyle={{ alignSelf: 'center', width: '90%'}}
          keyExtractor={(item) => String(item.key)}
          renderItem={({item}) => {
            return (
              <TouchableOpacity style={styles.chat}
                onPress={() => router.push({ pathname: "/(tabs)/chatbot/[id]", params: { id: String(item.key) } })}
              >
                <View>
                  <AdaptiveText style={styles.chatTitle}>{item.title}</AdaptiveText>
                  <AdaptiveText style={styles.chatContent}>{item.content}</AdaptiveText>
                </View>
                <AntDesign name="arrowright" size={24} color={darkMode ? colors.white : colors.black} />
              </TouchableOpacity>
            )
          }}

          ListHeaderComponent={<View style={{ height: 30 }} />} // top padding
          ItemSeparatorComponent={() => <View style={{ height: 15 }} />} // spacing between cards
        />
      :
        <AdaptiveText style={{
            alignSelf: 'center',
            fontFamily: 'Poppins-SemiBold',
            marginTop: 250
        }}>No items found.</AdaptiveText>
      }
      
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    title: {
      fontSize: 26,
      fontFamily: 'Poppins-Bold',
      marginTop: 40,
      textAlign: 'center'
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Poppins-Regular',
      marginTop: 5,
      textAlign: 'center'
    },
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chat: {
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderRadius: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    chatTitle: {
      fontFamily: 'Poppins-SemiBold'
    },
    chatContent: {
      fontFamily: 'Poppins-Light'
    }
  })
};