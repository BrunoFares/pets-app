import FilterByModal from "@/components/FilterByModal";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import ShopItem from "@/components/ShopItem";
import SortByModal from "@/components/SortByModal";
import { colors } from "@/constants/colors";
import { PlaceModel } from "@/data/models";
import { formatPlaceLocation } from "@/lib/discovery-api";
import { FontAwesome, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const ExploreTab = ({
  items,
  title,
}: {
  items: PlaceModel[];
  title: string;
}) => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const router = useRouter();
  const [sortByModal, setSortByModal] = useState(false);
  const [filterByModal, setFilterByModal] = useState(false);
  const [displayedItems, setDisplayedItems] = useState(items);
  const placeholderText = "Search for " + title;

  useEffect(() => {
    setDisplayedItems(items);
  }, [items]);

  const searchItems = (prompt: string) => {
    const display = items.filter((item) => {
      return item.Name.toLowerCase().includes(prompt.toLowerCase());
    });
    setDisplayedItems(display);
  };

  const filterItems = (_filters: string[]) => {};

  const sortItems = (order: string) => {
    const nextItems = [...displayedItems];

    switch (order) {
      case "atoz":
        nextItems.sort((a, b) => a.Name.localeCompare(b.Name));
        break;
      case "ztoa":
        nextItems.sort((a, b) => b.Name.localeCompare(a.Name));
        break;
      default:
        break;
    }

    setDisplayedItems(nextItems);
  };

  return (
    <View
      style={{
        backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={styles.utilityBar}>
        <TouchableOpacity onPress={() => setFilterByModal(!filterByModal)}>
          <FontAwesome6
            name="filter"
            size={24}
            color={darkMode ? colors.white : colors.green}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setSortByModal(!sortByModal)}>
          <MaterialIcons
            name="sort"
            size={24}
            color={darkMode ? colors.white : colors.green}
          />
        </TouchableOpacity>

        <TextInput
          onChangeText={searchItems}
          style={styles.textInput}
          placeholder={placeholderText}
          placeholderTextColor={darkMode ? colors.lightGrey : colors.darkGrey}
        />

        <TouchableOpacity>
          <FontAwesome
            name="search"
            size={24}
            color={darkMode ? colors.white : colors.green}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.list}
        data={displayedItems}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        keyExtractor={(item) => String(item.Id)}
        contentContainerStyle={{
          width: 370,
          flexGrow: displayedItems.length === 0 ? 1 : 0,
          justifyContent: displayedItems.length === 0 ? "center" : "flex-start",
        }}
        renderItem={({ item }) => {
          return (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/explore/[key]",
                  params: { key: String(item.Id) },
                })
              }
            >
              <ShopItem
                name={item.Name}
                location={formatPlaceLocation(item)}
                image={item.Photo}
              />
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
        ListEmptyComponent={
          <ProfileEmptyState
            title={`No ${title.toLowerCase()} found`}
            subtitle="Try another search term or check back later."
            style={{ width: 370, marginTop: 0 }}
          />
        }
        ListFooterComponent={
          <View style={{ height: Platform.select({ ios: 90, android: 100 }) }} />
        }
      />

      <FilterByModal
        visible={filterByModal}
        onClose={() => setFilterByModal(false)}
        onDone={(value) => filterItems(value)}
      />
      <SortByModal
        visible={sortByModal}
        onClose={() => setSortByModal(false)}
        onDone={(value) => sortItems(value)}
      />
    </View>
  );
};

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    utilityBar: {
      flexDirection: "row",
      marginVertical: 15,
      gap: 10,
      alignItems: "center",
    },
    textInput: {
      height: 50,
      alignItems: "center",
      width: "60%",
      fontFamily: "Poppins-Regular",
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
      color: darkMode ? colors.white : colors.black,
      borderRadius: 30,
      paddingLeft: 20,
    },
    list: {
      flex: 1,
    },
  });
};

export default ExploreTab;
