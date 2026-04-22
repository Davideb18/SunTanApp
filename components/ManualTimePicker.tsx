import React, { useRef } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
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
        style={[styles.itemContainer, isSelected && styles.selectedItemContainer]}
        onPress={() => {
          onChange(item);
          flatListRef.current?.scrollToOffset({ 
            offset: (index - 1) * ITEM_HEIGHT, 
            animated: true 
          });
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
          {item}
        </Text>
        <Text style={[styles.unitText, isSelected && styles.selectedUnitText]}>MINUTES</Text>
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
    <View style={styles.container}>
      <Text style={styles.label}>VERTICAL SELECTION</Text>
      <View style={styles.listWrapper}>
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
        <View style={styles.focusFrame} pointerEvents="none" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    marginTop: 6,
  },
  label: {
    fontSize: 9,
    fontWeight: "900",
    color: "rgba(255,255,255,0.25)",
    letterSpacing: 2,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  listWrapper: {
    width: "100%",
    height: CONTAINER_HEIGHT,
    justifyContent: "center",
    overflow: "hidden",
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.3,
    transform: [{ scale: 0.8 }],
  },
  selectedItemContainer: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
  },
  itemText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  selectedItemText: {
    color: COLORS.accentYellow,
    fontSize: 22,
  },
  unitText: {
    fontSize: 7,
    fontWeight: "900",
    color: "rgba(255,255,255,0.4)",
    marginTop: -2,
    letterSpacing: 0.5,
  },
  selectedUnitText: {
    color: COLORS.accentYellow,
    opacity: 0.8,
  },
  focusFrame: {
    position: "absolute",
    top: ITEM_HEIGHT,
    left: "15%",
    right: "15%",
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,222,0,0.15)",
    zIndex: -1,
  }
});
