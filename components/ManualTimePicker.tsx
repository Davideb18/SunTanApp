import React, { useRef } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { COLORS } from "@/constants/theme";

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 3;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface Props {
  value: number; // minutes
  onChange: (value: number) => void;
}

export function ManualTimePicker({ value, onChange }: Props) {
  // Generate options from 5 to 60 minutes
  const options = Array.from({ length: 12 }, (_, i) => (i + 1) * 5);
  const flatListRef = useRef<FlatList>(null);

  // We add empty items at top/bottom to allow centering first/last real items
  const data = [0, ...options, 0];

  const renderItem = ({ item, index }: { item: number; index: number }) => {
    if (item === 0) return <View style={{ height: ITEM_HEIGHT }} />;

    const isSelected = item === value;
    
    return (
      <TouchableOpacity 
        className="h-10 w-full items-center justify-center"
        style={{
          opacity: isSelected ? 1 : 0.3,
          transform: [{ scale: isSelected ? 1.15 : 0.8 }],
        }}
        onPress={() => {
          onChange(item);
          flatListRef.current?.scrollToOffset({ 
            offset: (index - 1) * ITEM_HEIGHT, 
            animated: true 
          });
        }}
        activeOpacity={0.7}
      >
        <Text className="text-[18px] font-black text-white" style={isSelected ? { color: COLORS.accentYellow, fontSize: 22 } : undefined}>
          {item}
        </Text>
        <Text
          className="-mt-0.5 text-[7px] font-black tracking-[0.5px] text-white/40"
          style={isSelected ? { color: COLORS.accentYellow, opacity: 0.8 } : undefined}
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
    <View className="mt-1.5 w-full items-center">
      <Text className="mb-2.5 text-[9px] font-black uppercase tracking-[2px] text-white/25">VERTICAL SELECTION</Text>
      <View className="w-full justify-center overflow-hidden" style={{ height: CONTAINER_HEIGHT }}>
        <FlatList
          ref={flatListRef}
          data={data}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={onScroll}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          initialScrollIndex={options.indexOf(value)}
        />
        {/* Visual Focus Indicators */}
        <View
          pointerEvents="none"
          className="absolute z-[-1]"
          style={{
            top: ITEM_HEIGHT,
            left: "15%",
            right: "15%",
            height: ITEM_HEIGHT,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: "rgba(255,222,0,0.15)",
          }}
        />
      </View>
    </View>
  );
}
