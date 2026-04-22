import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface Props {
  mode: "coach" | "personal";
  onChange: (mode: "coach" | "personal") => void;
}

export function ModeSelector({ mode, onChange }: Props) {
  return (
    <View className="w-full flex-row rounded-2xl bg-white/10 p-1">
      <TouchableOpacity
        className={`flex-1 items-center rounded-xl py-2.5 ${mode === "coach" ? "bg-accentYellow" : ""}`}
        onPress={() => onChange("coach")}
        activeOpacity={0.8}
      >
        <Text className={`text-xs font-extrabold tracking-[1px] ${mode === "coach" ? "text-black" : "text-white/40"}`}>
          COACH
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        className={`flex-1 items-center rounded-xl py-2.5 ${mode === "personal" ? "bg-accentYellow" : ""}`}
        onPress={() => onChange("personal")}
        activeOpacity={0.8}
      >
        <Text className={`text-xs font-extrabold tracking-[1px] ${mode === "personal" ? "text-black" : "text-white/40"}`}>
          PERSONAL
        </Text>
      </TouchableOpacity>
    </View>
  );
}
