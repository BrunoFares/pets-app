import { AdaptiveText } from "@/components/AdaptiveText";
import CustomImage from "@/components/CustomImage";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageHeader } from "@/components/PageHeader";
import { ProfileEmptyState } from "@/components/ProfileEmptyState";
import { colors } from "@/constants/colors";
import { presentApiError } from "@/lib/api-feedback";
import {
  BlockedUser,
  getBlockedUsers,
  unblockUser,
} from "@/lib/user-blocks";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getBlockedUserName(user: BlockedUser) {
  const fullName = [user.FirstName, user.LastName].filter(Boolean).join(" ");

  return fullName || user.Username || "Blocked user";
}

export default function BlockedUsersScreen() {
  const darkMode = useColorScheme() === "dark";
  const styles = createStyles({ darkMode });
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);

  const loadBlockedUsers = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const users = await getBlockedUsers({ force: true });
      setBlockedUsers(users);
    } catch (error) {
      presentApiError("Could not load blocked users", error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBlockedUsers();
    }, [loadBlockedUsers]),
  );

  const confirmUnblockUser = (user: BlockedUser) => {
    Alert.alert(
      "Unblock user?",
      `${getBlockedUserName(user)} will be able to interact with you again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: async () => {
            try {
              setUnblockingUserId(String(user.Id));
              await unblockUser(user.Id);
              setBlockedUsers((currentUsers) =>
                currentUsers.filter(
                  (blockedUser) => String(blockedUser.Id) !== String(user.Id),
                ),
              );
            } catch (error) {
              presentApiError("Unable to unblock user", error, {
                networkMessage:
                  "We couldn't reach the server, so the user was not unblocked.",
              });
            } finally {
              setUnblockingUserId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader
        title=""
        style={{ marginTop: Platform.select({ android: 20 }) }}
      />

      <AdaptiveText style={styles.title}>Blocked Users</AdaptiveText>

      <FlatList
        data={blockedUsers}
        keyExtractor={(item) => String(item.Id)}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          blockedUsers.length === 0 ? styles.emptyListContent : null,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadBlockedUsers(true)}
          />
        }
        renderItem={({ item }) => {
          const isUnblocking = unblockingUserId === String(item.Id);

          return (
            <View style={styles.userRow}>
              <View style={styles.userIdentity}>
                <CustomImage
                  image={item.AvatarUrl ?? ""}
                  customStyles={styles.avatar}
                />
                <View style={styles.userCopy}>
                  <AdaptiveText style={styles.userName} numberOfLines={1}>
                    {getBlockedUserName(item)}
                  </AdaptiveText>
                  {item.Username ? (
                    <AdaptiveText style={styles.username} numberOfLines={1}>
                      @{item.Username}
                    </AdaptiveText>
                  ) : null}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.unblockButton,
                  isUnblocking ? styles.disabledButton : null,
                ]}
                onPress={() => confirmUnblockUser(item)}
                disabled={isUnblocking}
                activeOpacity={0.85}
              >
                <AdaptiveText style={styles.unblockButtonText}>
                  {isUnblocking ? "Unblocking..." : "Unblock"}
                </AdaptiveText>
              </TouchableOpacity>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <ProfileEmptyState
            title="No blocked users"
            subtitle="People you block will appear here."
            compact
            style={styles.emptyState}
          />
        }
      />

      {isLoading && !isRefreshing ? <LoadingOverlay /> : null}
    </SafeAreaView>
  );
}

const createStyles = ({ darkMode }: { darkMode: boolean }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
      alignItems: "center",
    },
    title: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 28,
      marginBottom: 24,
      alignSelf: "center",
    },
    list: {
      flex: 1,
      width: "100%",
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    emptyListContent: {
      flexGrow: 1,
      justifyContent: "center",
    },
    userRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: darkMode ? colors.darkGrey : colors.lightGrey,
    },
    userIdentity: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      flexShrink: 0,
    },
    userCopy: {
      flex: 1,
      minWidth: 0,
    },
    userName: {
      fontFamily: "Poppins-SemiBold",
      fontSize: 15,
    },
    username: {
      marginTop: 2,
      fontFamily: "Poppins-Regular",
      fontSize: 12,
      color: darkMode ? colors.lightGrey : colors.darkGrey,
    },
    unblockButton: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: colors.green,
      flexShrink: 0,
    },
    disabledButton: {
      opacity: 0.65,
    },
    unblockButtonText: {
      color: colors.white,
      fontFamily: "Poppins-SemiBold",
      fontSize: 12,
    },
    separator: {
      height: 10,
    },
    emptyState: {
      width: "100%",
      marginTop: 0,
      marginBottom: 0,
      backgroundColor: darkMode ? colors.veryDarkGrey : colors.white,
    },
  });
