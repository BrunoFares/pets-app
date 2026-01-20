import { AdaptiveText } from "@/components/AdaptiveText";
import { PageHeader } from "@/components/PageHeader";
import { colors } from "@/constants/colors";
import { useGlobal } from "@/contexts/GlobalProvider";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ChatScreen = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const { payload } = useLocalSearchParams<{ payload?: string }>();
  const chat: any = payload ? JSON.parse(decodeURIComponent(payload)) : null;
  const { showFooter, setShowFooter } = useGlobal();

  useFocusEffect(
    useCallback(() => {
      // This code runs when the screen is focused.
      setShowFooter?.(false);

      return () => {
        // This code runs when the screen is unfocused (or unmounted).
        setShowFooter?.(true);
      };
    }, []), // The empty dependency array ensures the effect runs only on focus/unfocus.
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ height: "100%" }}>
        <PageHeader
          title={chat && chat.title ? chat.title : "something else"}
        />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.chatbotResponse}>
            <AdaptiveText
              style={[
                styles.chatbotText,
                showFooter !== undefined && !showFooter && { marginBottom: 70 },
              ]}
            >
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Commodi
              omnis itaque recusandae explicabo ex reprehenderit. Ullam alias
              ducimus deleniti facere, ad aliquid dolores tempore. Impedit
              repellendus placeat recusandae rerum adipisci molestiae unde.
              Maiores, culpa, fuga mollitia delectus asperiores optio, sit
              incidunt molestiae ratione doloremque recusandae omnis. Sequi
              facilis corrupti ab nihil at, ipsum veniam doloremque adipisci
              magnam cupiditate. Quod et laboriosam itaque odio, iusto at
              incidunt rem impedit, accusamus saepe, cumque voluptas ea
              cupiditate culpa officia beatae dicta? Soluta fuga assumenda nobis
              incidunt molestias facilis ipsum tenetur perferendis reiciendis
              repellat. Voluptatem officia porro vel vero quaerat ab, nesciunt
              quis eveniet mollitia, ipsa iste numquam. Provident ab distinctio
              assumenda deserunt sed itaque perspiciatis, quia natus aliquam
              modi! Animi iure laboriosam rerum cum necessitatibus, voluptates
              eligendi illo! Deleniti debitis nobis praesentium nesciunt vero?
              Repudiandae illo corrupti odit sequi voluptatem, eum totam vel
              quia itaque tenetur illum esse nihil architecto possimus provident
              odio at quae maiores ut delectus dolorum aliquid enim
              exercitationem animi? Repudiandae, sapiente eligendi voluptatem
              laborum quos incidunt atque ducimus, temporibus vel cum
              perspiciatis tenetur voluptas officiis ratione corrupti error non
              placeat rem nisi sit vitae accusamus debitis! Quam libero sequi
              vitae officiis eius rem exercitationem veritatis eligendi
              obcaecati. Eveniet ratione eius saepe, veniam nobis at assumenda
              laboriosam soluta accusantium dignissimos! Officia incidunt
              accusamus expedita minima, autem, ad est quam neque debitis
              tenetur, quas sed velit porro aliquid exercitationem! Vel facilis
              modi voluptate? Exercitationem quae architecto cum suscipit!
              Aspernatur deserunt accusamus minus quibusdam? Quis iure ipsum
              distinctio eaque illum fugiat corrupti nisi sequi incidunt beatae
              laudantium, ab consectetur suscipit dolorum quae necessitatibus
              tempore sunt quo! Eius corrupti iusto placeat deserunt esse vel
              corporis ipsam labore quia expedita! Ducimus autem voluptas
              quibusdam enim iusto quis voluptatem a, unde maiores, ut
              blanditiis libero laboriosam provident, vero corporis explicabo?
              Earum, sit velit. Debitis voluptates eaque expedita eveniet
              laudantium praesentium magni ratione, voluptatem ut at veniam, a
              quo totam ducimus, suscipit accusamus corporis sed. Omnis quos aut
              mollitia eaque delectus quis itaque ad consequatur quia quisquam
              iste error aspernatur nihil, nobis praesentium quae dolorem cumque
              placeat exercitationem voluptatem laudantium aliquid nulla?
              Dolorum sunt asperiores inventore natus fugit, magnam dicta fugiat
              expedita, cupiditate ducimus voluptate, labore incidunt
              recusandae. Ullam, qui cum fugiat dignissimos illo accusantium
              quasi alias repellendus, cupiditate labore quas, illum laudantium
              perspiciatis unde quidem deserunt aut. Debitis reprehenderit neque
              autem minus sed officiis ea voluptatibus et sapiente aliquid nam
              dignissimos inventore cupiditate, voluptatem omnis ullam quaerat
              nobis? Amet reprehenderit officiis odit magnam cumque totam
              accusantium incidunt delectus facilis at illum quis, natus, nulla
              numquam adipisci animi atque temporibus, debitis neque similique
              mollitia. Eius nostrum soluta et, porro deleniti aliquam iure
              officiis perspiciatis quia possimus rerum veniam reprehenderit
              minus non excepturi, voluptatibus quas maiores ut at! Quos ipsam
              ullam ab nesciunt odio provident. Amet voluptatem cupiditate
              exercitationem cumque eveniet, reiciendis aut praesentium unde
              molestias veritatis dolorem quaerat mollitia architecto aliquam
              quo possimus? Similique sit blanditiis recusandae rerum iusto.
              Optio officia qui quae eveniet veniam, itaque temporibus, minus
              repellat, eum voluptatum explicabo accusantium atque illo unde?
            </AdaptiveText>
          </ScrollView>
        </TouchableWithoutFeedback>
        <View style={[styles.txtInputContainer]}>
          <TextInput
            placeholder="Enter a new prompt..."
            placeholderTextColor={darkMode ? colors.lightGrey : colors.darkGrey}
            style={styles.txtInput}
          />
          <TouchableOpacity>
            <Feather
              name="arrow-up"
              size={24}
              color={darkMode ? colors.white : colors.black}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
    chatbotResponse: {
      marginHorizontal: 20,
    },
    chatbotText: {
      fontFamily: "Poppins-Regular",
      fontSize: 18,
      marginBottom: 150,
    },
    txtInputContainer: {
      flexDirection: "row",
      width: "90%",
      position: "absolute",
      bottom: 10,
      alignSelf: "center",
      backgroundColor: darkMode ? colors.darkGrey : colors.white,
      borderRadius: 24,
      alignItems: "center",

      // shadow
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 10,
      shadowOpacity: 0.2,
      elevation: 8,
    },
    txtInput: {
      width: "90%",
      backgroundColor: darkMode ? colors.darkGrey : colors.white,
      color: darkMode ? colors.white : colors.black,
      fontFamily: "Poppins-Regular",
      fontSize: 16,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 24,
    },
  });
};
