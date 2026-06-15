import { Tabs } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';

function AnimatedTabBar({ state, descriptors, navigation }: any) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [tabWidth, setTabWidth] = useState(0);

  const visibleRoutes = state.routes.filter((r: any) => r.name !== 'permissions');

  useEffect(() => {
    if (tabWidth > 0) {
      // Find the index in visible routes
      const visibleIndex = visibleRoutes.findIndex((r: any) => r.key === state.routes[state.index]?.key);
      if (visibleIndex !== -1) {
        Animated.spring(slideAnim, {
          toValue: visibleIndex * tabWidth,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }).start();
      }
    }
  }, [state.index, tabWidth, visibleRoutes]);

  return (
    <View 
      className="flex-row items-center bg-[#F8FAFC]" 
      style={{ height: 100, paddingHorizontal: 20, paddingBottom: 30 }}
      onLayout={(e) => {
        const availableWidth = e.nativeEvent.layout.width - 40; // 40 is paddingHorizontal * 2
        setTabWidth(availableWidth / visibleRoutes.length);
      }}
    >
      {/* Sliding Blue Pill Background */}
      {tabWidth > 0 && (
        <Animated.View 
          style={{
            position: 'absolute',
            left: 20,
            bottom: 30,
            width: tabWidth,
            height: 60,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ translateX: slideAnim }]
          }}
        >
          <View style={{ width: 100, height: 60, backgroundColor: '#2563EB', borderRadius: 24 }} />
        </Animated.View>
      )}

      {/* Tab Buttons */}
      {visibleRoutes.map((route: any, index: number) => {
        const isFocused = state.routes[state.index]?.key === route.key;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName = '';
        let IconFamily: any = Ionicons;
        let label = '';

        if (route.name === 'index') {
          iconName = 'home-outline';
          label = 'Apps';
        } else if (route.name === 'settings') {
          iconName = 'settings-outline';
          label = 'Settings';
        }

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={1}
            onPress={onPress}
            style={{ flex: 1, height: 60, alignItems: 'center', justifyContent: 'center' }}
          >
            <IconFamily name={iconName} size={22} color={isFocused ? '#FFFFFF' : '#64748B'} />
            <Text className={`text-[11px] font-bold mt-1 ${isFocused ? 'text-white' : 'text-[#64748B]'}`}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs 
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="permissions" options={{ href: null }} />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
