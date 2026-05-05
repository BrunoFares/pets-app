import FilterByModal from "@/components/FilterByModal";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import ShopItem from "@/components/ShopItem";
import SortByModal from "@/components/SortByModal";
import { colors } from "@/constants/colors";
import { PlaceModel } from "@/data/models";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { presentApiError } from "@/lib/api-feedback";
import {
  fetchCharityOrganisations,
  formatPlaceLocation,
} from "@/lib/discovery-api";
import {
  getDisplayedPlaces,
  PlaceFilter,
  PlaceSortOrder,
} from "@/lib/place-list-utils";
import { formatPlaceReviewSummaryLabel } from "@/lib/place-reviews";
import { FontAwesome, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

const CharitiesListScreen = () => {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const router = useRouter();
  const [sortByModal, setSortByModal] = useState(false);
  const [filterByModal, setFilterByModal] = useState(false);
  const [charityOrganisations, setCharityOrganisations] = useState<
    PlaceModel[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<PlaceFilter[]>([]);
  const [sortOrder, setSortOrder] = useState<PlaceSortOrder>("popular");
  const [isLoading, setIsLoading] = useState(true);

  const loadCharityOrganisations = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetchCharityOrganisations();
      setCharityOrganisations(response);
    } catch (error) {
      setCharityOrganisations([]);
      presentApiError("Could not load charity organisations", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCharityOrganisations();

      return () => {};
    }, [loadCharityOrganisations]),
  );

  const { isRefreshing, onRefresh } = usePullToRefresh(
    loadCharityOrganisations,
  );
  const showLoadingOverlay = isLoading && !isRefreshing;
  const displayedItems = useMemo(
    () =>
      getDisplayedPlaces({
        places: charityOrganisations,
        searchTerm,
        filters: activeFilters,
        sortOrder,
      }),
    [activeFilters, charityOrganisations, searchTerm, sortOrder],
  );

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader title="Charity Organisations" />
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
          onChangeText={setSearchTerm}
          style={styles.textInput}
          placeholder="Search for charity orgs..."
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
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        keyExtractor={(item) => item.Id}
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
                  pathname: "/individual-charity-screen",
                  params: { key: item.Id },
                })
              }
            >
              <ShopItem
                name={item.Name}
                location={formatPlaceLocation(item)}
                image={item.Photo}
                rating={formatPlaceReviewSummaryLabel({
                  AverageRating: item.AverageRating,
                  ReviewsCount: item.ReviewsCount,
                })}
              />
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
        ListEmptyComponent={
          <ProfileEmptyState
            title="No charity organisations found"
            subtitle="Try another search term or check back later."
            style={{ width: 370, marginTop: 0 }}
          />
        }
        ListFooterComponent={
          <View
            style={{ height: Platform.select({ ios: 90, android: 100 }) }}
          />
        }
      />

      <FilterByModal
        visible={filterByModal}
        onClose={() => setFilterByModal(false)}
        selectedFilters={activeFilters}
        onDone={setActiveFilters}
      />
      <SortByModal
        visible={sortByModal}
        onClose={() => setSortByModal(false)}
        onDone={(value) => setSortOrder(value as PlaceSortOrder)}
      />

      {showLoadingOverlay && <LoadingOverlay />}
    </SafeAreaView>
  );
};

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      marginBottom: -90,
    },
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

export default CharitiesListScreen;
