import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CloudSun, Clock, User2 } from "lucide-react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

import { COLORS } from "@/constants/theme";
import { useTranslation } from "@/constants/i18n";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TAB_BAR_WIDTH = SCREEN_WIDTH - 32;
const TAB_BAR_HEIGHT = 68;
const HUMP_RADIUS = 38;

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View className="absolute bottom-0 left-0 right-0 z-[1000] items-center" style={{ paddingBottom: insets.bottom + 4 }}>
      
      {/* THE FLOATING GLASS BAR (ONLY ELEMENT) */}
      <View className="items-center" style={{ width: TAB_BAR_WIDTH, height: TAB_BAR_HEIGHT + 40, marginBottom: 0 }}>
        <View className="absolute inset-0 z-[-1]">
          <Svg width={TAB_BAR_WIDTH + 4} height={TAB_BAR_HEIGHT + 40} viewBox={`0 0 ${TAB_BAR_WIDTH + 4} ${TAB_BAR_HEIGHT + 40}`} style={{ marginLeft: -2 }}>
            <Defs>
              <LinearGradient id="tabBarGradient" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={COLORS.accentRed} />
                <Stop offset="1" stopColor={COLORS.Yellow} />
              </LinearGradient>
            </Defs>
            <Path
              d={`
                M 26,34
                H ${TAB_BAR_WIDTH / 2 - HUMP_RADIUS - 13}
                C ${TAB_BAR_WIDTH / 2 - HUMP_RADIUS + 2},34 ${TAB_BAR_WIDTH / 2 - HUMP_RADIUS + 2},4 ${TAB_BAR_WIDTH / 2 + 2},4
                C ${TAB_BAR_WIDTH / 2 + HUMP_RADIUS + 2},4 ${TAB_BAR_WIDTH / 2 + HUMP_RADIUS + 2},34 ${TAB_BAR_WIDTH / 2 + HUMP_RADIUS + 17},34
                H ${TAB_BAR_WIDTH - 22}
                A 24,24 0 0 1 ${TAB_BAR_WIDTH + 2},58
                V ${TAB_BAR_HEIGHT + 10}
                A 24,24 0 0 1 ${TAB_BAR_WIDTH - 22},${TAB_BAR_HEIGHT + 34}
                H 26
                A 24,24 0 0 1 2,${TAB_BAR_HEIGHT + 10}
                V 58
                A 24,24 0 0 1 26,34
                Z
              `}
              fill="url(#tabBarGradient)" 
              stroke="rgba(255, 255, 255, 0.85)"
              strokeWidth={2.5}
            />
          </Svg>
        </View>

        {/* ITEMS LAYER */}
        <View className="h-full w-full flex-row items-end justify-between px-2 pb-5">
          {state.routes.map((_, index) => {
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
                  className="h-full flex-[1.5] items-center justify-end"
                  activeOpacity={0.8}
                >
                   <View className={`mb-[-12px] h-20 w-20 items-center justify-center rounded-full ${isFocused ? "bg-white/5" : ""}`}>
                     <View className="mb-1 h-[60px] w-[60px] items-center justify-center rounded-full bg-white/5 p-0.5">
                       <View
                        className="h-[58px] w-[58px] items-center justify-center rounded-full bg-accentYellow"
                        style={{
                          shadowColor: COLORS.accentYellow,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.8,
                          shadowRadius: 15,
                          elevation: 8,
                        }}
                       >
                            <Image 
                              source={require("@/assets/sun.png")} 
                          style={{ width: 52, height: 52 }}
                              resizeMode="contain"
                            />
                         </View>
                      </View>
                   </View>
                    <Text className={`mt-1.5 text-center text-[11px] font-black tracking-[1.5px] ${isFocused ? "text-white" : "text-white/50"}`}>
                      {t.tracker}
                    </Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                className="h-full flex-1 items-center justify-end"
                activeOpacity={0.7}
              >
                <IconComp size={24} color={isFocused ? activeColor : inactiveColor} strokeWidth={2.2} />
                <View className="items-center">
                  <Text className={`mt-1.5 text-center text-[11px] font-black tracking-[1.5px] ${isFocused ? "text-white" : "text-white/50"}`}>
                    {route.name === "weather" ? t.environment : t.myStudio}
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
