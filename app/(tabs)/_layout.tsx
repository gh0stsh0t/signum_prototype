import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { DynamicColorIOS, Platform } from "react-native";

export default function TabLayout() {
  return (
    <NativeTabs
      tintColor={
        Platform.OS === "ios"
          ? DynamicColorIOS({ dark: "white", light: "black" })
          : "black"
      }
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="lesson">
        <NativeTabs.Trigger.Icon
          sf={{ default: "book", selected: "book.fill" }}
          md="library_books"
        />
        <NativeTabs.Trigger.Label>Lesson</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
