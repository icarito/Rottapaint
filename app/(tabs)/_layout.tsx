import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#131822",
          borderTopColor: "#1E2A3A",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#4FC3F7",
        tabBarInactiveTintColor: "#607589",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="mail" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="investigate"
        options={{
          title: "Investigate",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="heatmap"
        options={{
          title: "Heatmap",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="flame" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="globe"
        options={{
          title: "Globe",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="globe" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
