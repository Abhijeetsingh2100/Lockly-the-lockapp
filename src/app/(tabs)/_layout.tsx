import { Tabs } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#F8FAFC',
          borderTopWidth: 0,
          elevation: 0,
          height: 85,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View className={`items-center justify-center w-20 h-[60px] mt-4 rounded-[24px] ${focused ? 'bg-[#2563EB]' : ''}`}>
              <Ionicons name="home-outline" size={22} color={focused ? '#FFFFFF' : '#64748B'} />
              <Text className={`text-[11px] font-bold mt-1 ${focused ? 'text-white' : 'text-[#64748B]'}`}>Apps</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="permissions"
        options={{
          tabBarIcon: ({ focused }) => (
            <View className={`items-center justify-center w-[100px] h-[60px] mt-4 rounded-[24px] ${focused ? 'bg-[#2563EB]' : ''}`}>
              <MaterialCommunityIcons name="shield-outline" size={22} color={focused ? '#FFFFFF' : '#64748B'} />
              <Text className={`text-[11px] font-bold mt-1 ${focused ? 'text-white' : 'text-[#64748B]'}`}>Permissions</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <View className={`items-center justify-center w-20 h-[60px] mt-4 rounded-[24px] ${focused ? 'bg-[#2563EB]' : ''}`}>
              <Ionicons name="settings-outline" size={22} color={focused ? '#FFFFFF' : '#64748B'} />
              <Text className={`text-[11px] font-bold mt-1 ${focused ? 'text-white' : 'text-[#64748B]'}`}>Settings</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
