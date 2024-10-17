import { Stack } from "expo-router";
import { DataProvider } from "./DataContext";

export default function RootLayout() {
  return (
       // Wrap the entire layout including Stack with DataProvider
    <DataProvider>
      <RootStack />
    </DataProvider>
  );
}

// Create a separate component for the stack
function RootStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="data-page" options={{ title: 'Stored Data' }} />
    </Stack>
  );
}
