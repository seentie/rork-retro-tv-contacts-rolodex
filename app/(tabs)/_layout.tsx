import { Tabs } from "expo-router";
import { Users, Settings, Plus } from "lucide-react-native";
import React from "react";
import { RolodexTheme } from "@/constants/rolodex-theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: RolodexTheme.colors.tabActive,
        tabBarStyle: {
          backgroundColor: RolodexTheme.colors.background,
          borderTopColor: RolodexTheme.colors.border,
        },
        headerStyle: {
          backgroundColor: RolodexTheme.colors.tabBackground,
        },
        headerTintColor: RolodexTheme.colors.tabText,
        headerTitleStyle: {
          fontFamily: RolodexTheme.fonts.typewriter,
          fontWeight: 'bold',
        },
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "My Retro Rolodex",
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add Contact",
          tabBarIcon: ({ color }) => <Plus color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}