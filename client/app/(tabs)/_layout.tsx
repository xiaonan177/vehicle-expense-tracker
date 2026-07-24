import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { useCSSVariable } from "uniwind";

export default function TabLayout() {
  const [background, muted, accent, border] = useCSSVariable([
    "--color-background",
    "--color-muted",
    "--color-accent",
    "--color-border",
  ]) as string[];

  const tabBarStyle: Record<string, string | number> = {
    backgroundColor: background,
    borderTopWidth: 1,
    borderTopColor: border,
  };

  if (Platform.OS === "web") {
    tabBarStyle.height = "auto";
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "首页",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "费用",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="receipt" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="files"
        options={{
          title: "文件",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="folder-open" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: "提醒",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="bell" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
