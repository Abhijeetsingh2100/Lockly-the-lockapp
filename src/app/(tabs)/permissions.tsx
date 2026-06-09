import { View, Text, ScrollView, TouchableOpacity, Modal, Switch, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppStorage } from '../../utils/storage';

export default function Permissions() {
  const [lockedApps, setLockedApps] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [permissions, setPermissions] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadApps();
    }, [])
  );

  const loadApps = async () => {
    const apps = await AppStorage.getLockedApps();
    setLockedApps(apps);
  };

  const openAppControlPanel = async (app: any) => {
    setSelectedApp(app);
    const perms = await AppStorage.getAppPermissions(app.id);
    setPermissions(perms);
    setModalVisible(true);
  };

  const togglePermission = async (key: string) => {
    const newPerms = { ...permissions, [key]: !permissions[key] };
    setPermissions(newPerms);
    if (selectedApp) {
      await AppStorage.saveAppPermissions(selectedApp.id, newPerms);
    }
  };

  const getIconSource = (iconPath: string) => {
    if (!iconPath) return null;
    if (iconPath.startsWith('data:image')) return { uri: iconPath };
    if (iconPath.length > 500 && !iconPath.startsWith('http') && !iconPath.startsWith('file://') && !iconPath.startsWith('/')) {
      return { uri: 'data:image/png;base64,' + iconPath };
    }
    if (iconPath.startsWith('http') || iconPath.startsWith('file://')) return { uri: iconPath };
    return { uri: 'file://' + iconPath };
  };

  const renderIcon = (app: any) => {
    if (app.iconType === 'DeviceIcon') {
      const source = getIconSource(app.iconUri);
      if (source) {
        return <Image source={source} style={{ width: 40, height: 40, borderRadius: 12 }} resizeMode="contain" />;
      }
      return <MaterialCommunityIcons name="android" size={24} color="#64748B" />;
    }
    if (app.iconType === 'MaterialCommunityIcons') return <MaterialCommunityIcons name={app.icon} size={24} color={app.iconColor} />;
    if (app.iconType === 'Feather') return <Feather name={app.icon} size={24} color={app.iconColor} />;
    if (app.iconType === 'FontAwesome5') return <FontAwesome5 name={app.icon} size={20} color={app.iconColor} />;
  };

  const renderPermissionItem = (key: string, title: string, iconName: any, IconFamily: any, isLast: boolean = false) => (
    <View className={`flex-row items-center justify-between py-5 ${!isLast ? 'border-b border-gray-100' : ''}`}>
      <View className="flex-row items-center gap-4">
        <View className="w-11 h-11 bg-blue-50 rounded-full items-center justify-center">
          <IconFamily name={iconName} size={22} color="#2563EB" />
        </View>
        <Text className="text-[17px] text-[#1E293B] font-bold">{title}</Text>
      </View>
      <Switch
        trackColor={{ false: '#E2E8F0', true: '#DBEAFE' }}
        thumbColor={permissions[key] ? '#2563EB' : '#FFFFFF'}
        ios_backgroundColor="#E2E8F0"
        onValueChange={() => togglePermission(key)}
        value={permissions[key]}
      />
    </View>
  );

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
      <View className="px-6 pt-4 pb-2 border-b border-gray-100">
        <Text className="text-[#0F172A] text-4xl font-extrabold">Permissions</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        <Text className="text-[#64748B] text-sm font-bold uppercase tracking-wider mb-2 ml-1">App Control Panels</Text>
        <Text className="text-[#64748B] text-sm mb-6 ml-1">Select an application to configure which device features it can access when opened.</Text>

        <View className="gap-4 pb-24">
          {lockedApps.map(app => (
            <TouchableOpacity 
              key={app.id} 
              activeOpacity={0.7}
              onPress={() => openAppControlPanel(app)}
              className="flex-row items-center justify-between bg-white p-4 rounded-[28px] shadow-sm border border-gray-50"
            >
              <View className="flex-row items-center gap-4">
                <View className={`w-14 h-14 rounded-2xl items-center justify-center ${app.bgColor}`}>
                  {renderIcon(app)}
                </View>
                <View>
                  <Text className="text-[#0F172A] text-lg font-bold">{app.name}</Text>
                  <Text className="text-sm font-medium text-[#64748B] mt-1">Configure Permissions</Text>
                </View>
              </View>
              <View className="w-10 h-10 bg-[#F1F5F9] rounded-full items-center justify-center">
                <Feather name="sliders" size={18} color="#2563EB" />
              </View>
            </TouchableOpacity>
          ))}
          
          {lockedApps.length === 0 ? (
            <View className="items-center py-10 mt-10">
              <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4">
                <MaterialCommunityIcons name="shield-lock-outline" size={48} color="#94A3B8" />
              </View>
              <Text className="text-[#0F172A] text-xl font-bold mt-2">No Apps Added</Text>
              <Text className="text-[#64748B] text-center mt-3 px-8 leading-relaxed">
                Go to the Apps tab and add applications to configure their specific permissions.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Control Panel Modal */}
      <Modal
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-[#F8FAFC]">
          <View className="flex-row items-center justify-between px-6 pt-4 pb-4 border-b border-gray-100 bg-white">
            <TouchableOpacity onPress={() => setModalVisible(false)} className="p-3 bg-[#F1F5F9] rounded-full">
              <Feather name="chevron-down" size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-[#0F172A]">Control Panel</Text>
            <View className="w-12" />
          </View>

          {selectedApp && (
            <ScrollView className="flex-1 px-5 pt-8" showsVerticalScrollIndicator={false}>
              <View className="items-center mb-8">
                <View className={`w-28 h-28 rounded-[32px] items-center justify-center mb-5 shadow-sm ${selectedApp.bgColor}`}>
                  {renderIcon(selectedApp)}
                </View>
                <Text className="text-3xl font-extrabold text-[#0F172A]">{selectedApp.name}</Text>
                <Text className="text-[#64748B] font-medium mt-2 text-base">Feature Access Rules</Text>
              </View>

              <View className="bg-white rounded-[32px] px-5 py-3 shadow-sm border border-gray-50 mb-12">
                {renderPermissionItem('disableControlPanel', 'Disable Control Panel', 'shield', Feather, !permissions.disableControlPanel)}
                
                {permissions.disableControlPanel && (
                  <View className="mt-2">
                    <Text className="text-[#64748B] text-xs font-bold uppercase tracking-wider mb-2 ml-2 mt-2">Allowed Features</Text>
                    {renderPermissionItem('wifi', 'Wi-Fi / Network', 'wifi', Feather)}
                    {renderPermissionItem('bluetooth', 'Bluetooth', 'bluetooth', Feather)}
                    {renderPermissionItem('camera', 'Camera', 'camera-outline', Ionicons)}
                    {renderPermissionItem('microphone', 'Microphone', 'mic-outline', Ionicons)}
                    {renderPermissionItem('location', 'Location Services', 'map-pin', Feather, true)}
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
