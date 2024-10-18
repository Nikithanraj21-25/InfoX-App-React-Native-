import { Drawer } from "expo-router/drawer";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Drawer
    screenOptions={{
      headerStyle: {
        backgroundColor: '#00539CFF', // Header background color
      },
      headerTintColor: '#FFFFFF', // Header text and icon color
    }}
  >
      <Drawer.Screen
        name="index" 
        options={{ 
          drawerLabel: "Home", 
          headerTitle: "Click2Contact"
        }}
      />
      <Drawer.Screen 
        name="AboutUs" 
        options={{ 
          drawerLabel: "About Us", 
          headerTitle: "About Us" 
        }} 
      />
    </Drawer>
  );
}
