import { colors } from "@/constants/colors";
import { useState } from "react";
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
} from "react-native";
import { AdaptiveText } from "./AdaptiveText";
import CustomModal from "./CustomModal";

const ListWithoutConfirmationModal = ({
  visible,
  onClose,
  onDone,
  listElements,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  onDone: (val: any) => void;
  listElements: any;
  title: string;
}) => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyle({ darkMode });
  const [selected, setSelected] = useState<any>();

  return (
    <CustomModal visible={visible} onClose={onClose}>
      <AdaptiveText style={styles.title}>{title}</AdaptiveText>
      <FlatList
        contentContainerStyle={styles.body}
        data={listElements}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setSelected(item.name);
              onDone(item);
            }}
          >
            <AdaptiveText
              style={{
                fontSize: 22,
                fontFamily:
                  selected === item.Name ? "Poppins-Bold" : "Poppins-Regular",
              }}
            >
              {item.Name}
            </AdaptiveText>
          </TouchableOpacity>
        )}
      />
    </CustomModal>
  );
};

export default ListWithoutConfirmationModal;

const createStyle = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      marginTop: 30,
      marginBottom: 40,
      gap: 20,
      width: 300,
      alignSelf: "center",
    },
    title: {
      fontFamily: "Poppins-Bold",
      fontSize: 26,
    },
    text: {
      color: darkMode ? colors.white : colors.black,
      fontFamily: "Poppins-Light",
      fontSize: 18,
      textAlign: "center",
      height: 25,
    },
    body: {
      justifyContent: "space-evenly",
      marginBottom: 80,
      marginTop: 50,
      width: "100%",
    },
  });
};
