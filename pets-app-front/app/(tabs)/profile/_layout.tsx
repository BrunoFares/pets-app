import { Stack } from "expo-router";

export default function ItemsStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Profile" }} />
      <Stack.Screen name="[pet]" options={{ title: "Pet" }} />
      <Stack.Screen name="add-pet" options={{ title: "Add Pet" }} />
      <Stack.Screen name="edit-pet" options={{ title: "Edit Pet" }} />
      <Stack.Screen name="edit-profile" options={{ title: "Edit Profile" }} />
      <Stack.Screen
        name="place-manager"
        options={{ title: "Place Manager" }}
      />
      <Stack.Screen name="place-editor" options={{ title: "Place Editor" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="consultation" options={{ title: "Consultation" }} />
      <Stack.Screen
        name="add-consultation"
        options={{ title: "Add Consultation" }}
      />
      <Stack.Screen
        name="modify-add-illness"
        options={{ title: "Modify and Add Illness" }}
      />
      <Stack.Screen
        name="modify-add-vaccine"
        options={{ title: "Modify and Add Illness" }}
      />
      <Stack.Screen name="vaccines" options={{ title: "Vaccines" }} />
      <Stack.Screen name="illnesses" options={{ title: "Illnesses" }} />
    </Stack>
  );
}
