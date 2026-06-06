import { View, Text, TextInput, ScrollView, Switch, TouchableOpacity, Modal, Image, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';

const initialApps = [
  { id: '1', name: 'WhatsApp', status: 'Protected', icon: 'chat', iconType: 'MaterialCommunityIcons', bgColor: 'bg-[#2563EB]', iconColor: 'white', isProtected: true },
  { id: '2', name: 'Instagram', status: 'Protected', icon: 'camera', iconType: 'Feather', bgColor: 'bg-[#475569]', iconColor: 'white', isProtected: true },
  { id: '3', name: 'Telegram', status: 'Unlocked', icon: 'paper-plane', iconType: 'FontAwesome5', bgColor: 'bg-[#E2E8F0]', iconColor: '#475569', isProtected: false },
  { id: '4', name: 'Gallery', status: 'Unlocked', icon: 'image', iconType: 'Feather', bgColor: 'bg-[#F1F5F9]', iconColor: '#475569', isProtected: false },
  { id: '5', name: 'YouTube', status: 'Protected', icon: 'youtube', iconType: 'Feather', bgColor: 'bg-[#FEE2E2]', iconColor: '#DC2626', isProtected: true },
];

export default function Home() {
  const [appStates, setAppStates] = useState(initialApps);
  const [modalVisible, setModalVisible] = useState(false);
  const [deviceApps, setDeviceApps] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const fetchApps = async () => {
    setLoadingApps(true);
    try {
      const { InstalledApps } = require('react-native-launcher-kit');
      
      try {
        const apps = await InstalledApps.getSortedApps({
          includeVersion: false,
          includeAccentColor: false,
        });
        setDeviceApps(apps || []);
      } catch (nativeError) {
        console.log('Native layer failed:', nativeError);
        setDeviceApps([
          { label: 'WhatsApp (Dummy)', packageName: 'com.whatsapp', icon: '' },
          { label: 'Instagram (Dummy)', packageName: 'com.instagram.android', icon: '' },
        ]);
        Alert.alert(
          "Rebuild Required",
          "Your current development build does not contain the new react-native-launcher-kit native code. You must compile a new build (npx expo run:android). Showing dummy data for now."
        );
      }
    } catch (error) {
      console.log('Error importing module:', error);
      Alert.alert("Error", String(error));
      setDeviceApps([]);
    }
    setLoadingApps(false);
  };

  const toggleSwitch = (id: string) => {
    setAppStates(prev => prev.map(app => 
      app.id === id 
        ? { ...app, isProtected: !app.isProtected, status: !app.isProtected ? 'Protected' : 'Unlocked' }
        : app
    ));
  };

  const renderIcon = (app: any) => {
    if (app.iconType === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={app.icon} size={24} color={app.iconColor} />;
    } else if (app.iconType === 'Feather') {
      return <Feather name={app.icon} size={24} color={app.iconColor} />;
    } else if (app.iconType === 'FontAwesome5') {
      return <FontAwesome5 name={app.icon} size={20} color={app.iconColor} />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top']}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-4 pb-2">
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons name="shield-check" size={28} color="#2563EB" />
          <Text className="text-[#2563EB] text-2xl font-bold tracking-tight">Lockly</Text>
        </View>
        <TouchableOpacity>
          <Feather name="more-vertical" size={24} color="#475569" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-4 pb-20" showsVerticalScrollIndicator={false}>
        <Text className="text-[#0F172A] text-4xl font-extrabold mb-6">My Apps</Text>
        
        {/* Search Bar */}
        <View className="flex-row items-center bg-[#EEF2FF] rounded-2xl px-4 py-4 mb-8">
          <Feather name="search" size={22} color="#64748B" />
          <TextInput 
            placeholder="Search apps..." 
            placeholderTextColor="#64748B"
            className="flex-1 ml-3 text-lg text-[#0F172A]"
          />
        </View>

        {/* App List */}
        <View className="gap-4 pb-24">
          {appStates.map(app => (
            <View key={app.id} className="flex-row items-center justify-between bg-white p-4 rounded-[28px] shadow-sm">
              <View className="flex-row items-center gap-4">
                <View className={`w-14 h-14 rounded-2xl items-center justify-center ${app.bgColor}`}>
                  {renderIcon(app)}
                </View>
                <View>
                  <Text className="text-[#0F172A] text-lg font-bold">{app.name}</Text>
                  <Text className={`text-sm font-semibold mt-1 ${app.isProtected ? 'text-[#2563EB]' : 'text-[#64748B]'}`}>
                    {app.status}
                  </Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: '#E2E8F0', true: '#DBEAFE' }}
                thumbColor={app.isProtected ? '#2563EB' : '#FFFFFF'}
                ios_backgroundColor="#E2E8F0"
                onValueChange={() => toggleSwitch(app.id)}
                value={app.isProtected}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        className="absolute bottom-6 right-6 w-16 h-16 bg-[#2563EB] rounded-2xl items-center justify-center shadow-lg z-50"
        onPress={() => {
          setModalVisible(true);
          fetchApps();
        }}
      >
        <Feather name="plus" size={32} color="white" />
      </TouchableOpacity>

      {/* Add App Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[32px] h-[80%] p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-[#0F172A]">Add Application</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                <Feather name="x" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {loadingApps ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="text-gray-500 mt-4 text-base font-medium">Loading installed apps...</Text>
              </View>
            ) : (
              <FlatList
                data={deviceApps}
                keyExtractor={(item) => item.packageName}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
                    <View className="flex-row items-center gap-4 flex-1">
                      {item.icon ? (
                        <Image source={{ uri: 'file://' + item.icon }} className="w-12 h-12 rounded-xl" />
                      ) : (
                        <View className="w-12 h-12 bg-gray-200 rounded-xl items-center justify-center">
                          <MaterialCommunityIcons name="android" size={24} color="gray" />
                        </View>
                      )}
                      <View className="flex-1 pr-4">
                        <Text className="text-[#0F172A] text-lg font-bold" numberOfLines={1}>{item.label}</Text>
                        <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>{item.packageName}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      className="bg-[#EEF2FF] px-4 py-2 rounded-full"
                      onPress={() => {
                        setModalVisible(false);
                      }}
                    >
                      <Text className="text-[#2563EB] font-bold">Add</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
