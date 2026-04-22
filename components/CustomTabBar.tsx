import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { BlurView } from "expo-blur";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloudSun, Clock, User2 } from "lucide-react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

import { COLORS } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TAB_BAR_WIDTH = SCREEN_WIDTH - 32;
const TAB_BAR_HEIGHT = 68;
const HUMP_RADIUS = 38;

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 4 }]}>
      
      {/* THE FLOATING GLASS BAR (ONLY ELEMENT) */}
      <View style={styles.floatingBarWrapper}>
        <View style={styles.svgWrapper}>
          <Svg width={TAB_BAR_WIDTH} height={TAB_BAR_HEIGHT + 35} viewBox={`0 0 ${TAB_BAR_WIDTH} ${TAB_BAR_HEIGHT + 30}`}>
            <Path
              d={`
                M 24,30
                H ${TAB_BAR_WIDTH / 2 - HUMP_RADIUS - 15}
                C ${TAB_BAR_WIDTH / 2 - HUMP_RADIUS},30 ${TAB_BAR_WIDTH / 2 - HUMP_RADIUS},0 ${TAB_BAR_WIDTH / 2},0
                C ${TAB_BAR_WIDTH / 2 + HUMP_RADIUS},0 ${TAB_BAR_WIDTH / 2 + HUMP_RADIUS},30 ${TAB_BAR_WIDTH / 2 + HUMP_RADIUS + 15},30
                H ${TAB_BAR_WIDTH - 24}
                A 24,24 0 0 1 ${TAB_BAR_WIDTH},54
                V ${TAB_BAR_HEIGHT + 6}
                A 24,24 0 0 1 ${TAB_BAR_WIDTH - 24},${TAB_BAR_HEIGHT + 30}
                H 24
                A 24,24 0 0 1 0,${TAB_BAR_HEIGHT + 6}
                V 54
                A 24,24 0 0 1 24,30
                Z
              `}
              fill="rgba(200, 100, 0, 1)" 
              stroke="rgba(255, 255, 255, 0.50)"
              strokeWidth={3}
            />
          </Svg>
        </View>

        {/* ITEMS LAYER */}
        <View style={styles.content}>
          {state.routes.map((route_item, index) => {
            const route = state.routes[index];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            let IconComp = CloudSun;
            if (route.name === "index") IconComp = Clock;
            if (route.name === "profile") IconComp = User2;

            const activeColor = COLORS.accentYellow;
            const inactiveColor = "rgba(255,255,255,0.6)";

            if (route.name === "index") {
              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  style={styles.centerTab}
                  activeOpacity={0.8}
                >
                   <View style={[styles.glowCircle, isFocused && styles.activeGlow]}>
                      <View style={styles.sunCircleOuter}>
                         <View style={styles.sunCircle}>
                            <Image 
                              source={require("@/assets/sun.png")} 
                              style={styles.sunImage} 
                              resizeMode="contain"
                            />
                         </View>
                      </View>
                   </View>
                   <Text style={[styles.tabLabel, isFocused && styles.activeText]}>TRACKER</Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.sideTab}
                activeOpacity={0.7}
              >
                <IconComp size={24} color={isFocused ? activeColor : inactiveColor} strokeWidth={2.2} />
                <View style={styles.labelGroup}>
                  <Text style={[styles.tabLabel, isFocused && styles.activeText]}>
                    {route.name === "weather" ? "HOME" : "PROFILE"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  floatingBarWrapper: {
    width: TAB_BAR_WIDTH,
    height: TAB_BAR_HEIGHT + 35,
    marginBottom: 0, // Lowered against the edge
    alignItems: "center",
  },
  svgWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 8,
    paddingBottom: 16,
    height: "100%",
  },
  sideTab: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  centerTab: {
    flex: 1.5,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  labelGroup: {
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1.5,
    marginTop: 6,
    textAlign: "center",
  },
  activeText: {
    color: "#FFFFFF",
  },
  sunCircleOuter: {
     width: 60,
     height: 60,
     borderRadius: 30,
     backgroundColor: "rgba(255,255,255,0.05)",
     padding: 2,
     alignItems: "center",
     justifyContent: "center",
     marginBottom: 4,
  },
  sunCircle: {
     width: 58,
     height: 58,
     borderRadius: 29,
     backgroundColor: COLORS.accentYellow,
     alignItems: "center",
     justifyContent: "center",
     shadowColor: COLORS.accentYellow,
     shadowOffset: { width: 0, height: 0 },
     shadowOpacity: 0.8,
     shadowRadius: 15,
     elevation: 8,
  },
  sunImage: {
     width: 52, // Enlarged sun image
     height: 52,
  },
  glowCircle: {
     width: 80,
     height: 80,
     borderRadius: 40,
     alignItems: "center",
     justifyContent: "center",
     marginBottom: -12,
  },
  activeGlow: {
     backgroundColor: "rgba(255, 255, 255, 0.05)",
  }
});
