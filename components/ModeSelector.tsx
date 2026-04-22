import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "@/constants/theme";

interface Props {
  mode: "coach" | "personal";
  onChange: (mode: "coach" | "personal") => void;
}

export function ModeSelector({ mode, onChange }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, mode === "coach" && styles.activeButton]}
        onPress={() => onChange("coach")}
        activeOpacity={0.8}
      >
        <Text style={[styles.text, mode === "coach" && styles.activeText]}>COACH</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, mode === "personal" && styles.activeButton]}
        onPress={() => onChange("personal")}
        activeOpacity={0.8}
      >
        <Text style={[styles.text, mode === "personal" && styles.activeText]}>PERSONAL</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 4,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  activeButton: {
    backgroundColor: COLORS.accentYellow,
    shadowColor: COLORS.accentYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(255, 255, 255, 0.4)",
  },
  activeText: {
    color: "#000000",
  },
});
