// app/(tabs)/_layout.tsx
import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { View, Text } from "react-native";

const ACTIVE = "#ffffff";
const INACTIVE = "rgba(255,255,255,0.6)";

// Icon + text inside a circular pill
function CircleIconLabel({
  name,
  label,
  focused,
}: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  label: string;
  focused: boolean;
}) {
  const circleBg = focused ? "rgba(255,255,255,0.18)" : "transparent";
  const color = focused ? ACTIVE : INACTIVE;

  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: circleBg,
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <FontAwesome name={name} size={20} color={color} />
      <Text style={{ color, fontSize: 10, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // Header (transparent so your screen can manage its own bg)
        headerStyle: { backgroundColor: "#ffff" },
        headerTintColor: "#000000",
        headerTitleStyle: { color: "#000" },
        headerTitleAlign: "center",
        // Tab bar
        tabBarStyle: {
          backgroundColor: "#181818",
          borderTopColor: "transparent",
          height: 90,        // increased height
          paddingTop: 15,     // extra top padding
          paddingBottom: 14, // extra bottom padding
          paddingHorizontal: 0,
        },
        tabBarShowLabel: false, // we render label inside the circle
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarItemStyle: { flexBasis: 0, flexGrow: 1, paddingVertical: 2 },
        tabBarIconStyle: { margin: 0 },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ href: null, headerShown: false }} />

      <Tabs.Screen
        name="home"
        options={{
          title: "Live Gas Levels",
          tabBarIcon: ({ focused }) => (
            <CircleIconLabel name="home" label="Home" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="log"
        options={{
          title: "Logs",
          headerShown: true,
          tabBarIcon: ({ focused }) => (
            <CircleIconLabel name="list" label="Log" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="archive"
        options={{
          title: "Archive",
          headerShown: true,
          tabBarIcon: ({ focused }) => (
            <CircleIconLabel name="archive" label="Archive" focused={focused} />
          ),
        }}
      />

    </Tabs>
  );
}
