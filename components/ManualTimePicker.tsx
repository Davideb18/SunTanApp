import React, { useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { COLORS } from "@/constants/theme";

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 3;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export function ManualTimePicker({ value, onChange }: Props) {
  const options = Array.from({ length: 12 }, (_, i) => (i + 1) * 5);
  const scrollRef = useRef<ScrollView>(null);

  // null items as padding so first/last real item can be centered
  const data: (number | null)[] = [null, ...options, null];

  const renderItem = ({ item, index }: { item: number | null; index: number }) => {
    if (item === null) return <View style={{ height: ITEM_HEIGHT, width: "100%" }} />;

    const isSelected = item === value;

    return (
      <TouchableOpacity
        style={{
          height: ITEM_HEIGHT,
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          opacity: isSelected ? 1 : 0.3,
          transform: [{ scale: isSelected ? 1.1 : 0.85 }],
        }}
        onPress={() => {
          onChange(item);
          // index-1 because of leading null padding item
          scrollRef.current?.scrollTo({
            y: (index - 1) * ITEM_HEIGHT,
            animated: true,
          });
        }}
        activeOpacity={0.7}
      >
        <Text
          style={{
            fontSize: isSelected ? 26 : 18,
            fontWeight: "900",
            color: isSelected ? COLORS.Yellow : "#FFFFFF",
            textAlign: "center",
          }}
        >
          {item}
        </Text>
        <Text
          style={{
            fontSize: 7,
            fontWeight: "900",
            letterSpacing: 0.5,
            marginTop: -2,
            textAlign: "center",
            color: isSelected ? COLORS.accentYellow : "rgba(255,255,255,0.4)",
            opacity: isSelected ? 0.8 : 1,
          }}
        >
          MINUTES
        </Text>
      </TouchableOpacity>
    );
  };

  const onScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const selectedValue = options[index];
    if (selectedValue && selectedValue !== value) {
      onChange(selectedValue);
    }
  };

  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      <View style={{ width: "100%", height: CONTAINER_HEIGHT, overflow: "hidden" }}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={onScroll}
          scrollEventThrottle={16}
          style={{ width: "100%" }}
          contentContainerStyle={{ paddingVertical: 0 }}
        >
          {data.map((item, index) => (
            <View key={index}>{renderItem({ item, index })}</View>
          ))}
        </ScrollView>

        {/* Linee di selezione su tutta la larghezza */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: ITEM_HEIGHT,
            left: 0,
            right: 0,
            height: ITEM_HEIGHT,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: "rgba(255,222,0,0.3)",
          }}
        />
      </View>
    </View>
  );
}
