import { View, Text, TextInput, ScrollView, Switch, TouchableOpacity, Modal, Image, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { AppStorage } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';

type AlertButton = { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' | 'default' };

const initialApps: any[] = [];

export default function Home() {
  const { role } = useAuth();
  const [appStates, setAppStates] = useState<any[]>([]);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const stored = await AppStorage.getLockedApps();
      if (stored && stored.length > 0) {
        setAppStates(stored);
      }
      setIsStorageLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (isStorageLoaded) {
      AppStorage.saveLockedApps(appStates);
    }
  }, [appStates, isStorageLoaded]);
  const [modalVisible, setModalVisible] = useState(false);
  const [deviceApps, setDeviceApps] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addAppSearchQuery, setAddAppSearchQuery] = useState('');
  
  const [customAlert, setCustomAlert] = useState<{ visible: boolean; title: string; message: string; buttons?: AlertButton[] }>({ 
    visible: false, 
    title: '', 
    message: '' 
  });

  const showAlert = (title: string, message: string, buttons?: AlertButton[]) => {
    setCustomAlert({ visible: true, title, message, buttons });
  };

  const hideAlert = () => {
    setCustomAlert(prev => ({ ...prev, visible: false }));
  };

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
          { label: 'WhatsApp', packageName: 'com.whatsapp', icon: 'https://logo.clearbit.com/whatsapp.com' },
          { label: 'Instagram', packageName: 'com.instagram.android', icon: 'https://logo.clearbit.com/instagram.com' },
          { label: 'YouTube', packageName: 'com.google.android.youtube', icon: 'https://logo.clearbit.com/youtube.com' },
        ]);
        showAlert(
          "Development Mode",
          "You are using the Expo Go client. Displaying mock applications for testing purposes."
        );
      }
    } catch (error) {
      console.log('Error importing module:', error);
      showAlert("Error", String(error));
      setDeviceApps([]);
    }
    setLoadingApps(false);
  };

  const handleAddApp = async (item: any) => {
    const appName = item.label || item.packageName || 'Unknown App';
    // Prevent adding same app multiple times
    if (appStates.some(app => app.name === appName)) {
      showAlert("Already Added", `${appName} is already in your apps list.`);
      return;
    }

    const isEnabled = await AppStorage.checkAccessibilityPermission();
    if (!isEnabled) {
      showAlert(
        "Accessibility Required",
        "Android 13+ blocks Accessibility for side-loaded apps. \n\n1. Click 'App Info' below, tap the 3 dots (⋮) in the top-right, and select 'Allow restricted settings'.\n2. Then click 'Accessibility' to turn it on.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "App Info", 
            style: "default",
            onPress: () => AppStorage.openAppInfoSettings()
          },
          { 
            text: "Accessibility", 
            style: "default",
            onPress: () => AppStorage.openAccessibilitySettings()
          }
        ]
      );
      return;
    }

    const newApp = {
      id: Date.now().toString(),
      name: appName,
      packageName: item.packageName,
      status: 'Protected',
      iconType: 'DeviceIcon',
      iconUri: item.icon,
      bgColor: 'bg-[#F1F5F9]',
      iconColor: '#475569',
      isProtected: true,
      icon: '', // Optional default for backward compatibility
    };

    setAppStates([...appStates, newApp]);
  };

  const handleRemoveApp = (id: string, name: string) => {
    if (role === 'user') {
      showAlert("Admin Access Required", "Only administrators can remove apps.");
      return;
    }

    showAlert(
      "Remove Application",
      `Are you sure you want to remove ${name} from your list?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => setAppStates(prev => prev.filter(app => app.id !== id))
        }
      ]
    );
  };

  const toggleSwitch = async (id: string) => {
    if (role === 'user') {
      showAlert("Admin Access Required", "Only administrators can enable or disable apps.");
      return;
    }

    const app = appStates.find(a => a.id === id);
    if (!app?.isProtected) {
      const isEnabled = await AppStorage.checkAccessibilityPermission();
      if (!isEnabled) {
        showAlert(
          "Permission Required",
          "SantaProtect requires the Accessibility Service to detect when locked apps are opened. Please enable it in Settings to protect your apps.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Open Settings", 
              style: "default",
              onPress: () => AppStorage.openAccessibilitySettings()
            }
          ]
        );
        return;
      }
      
      const { LocklyModule } = require('react-native').NativeModules;
      if (LocklyModule && LocklyModule.checkOverlayPermission) {
        const hasOverlay = await LocklyModule.checkOverlayPermission();
        if (!hasOverlay) {
          showAlert(
            "Overlay Permission Required",
            "SantaProtect needs 'Display over other apps' permission to show the lock screen over locked applications.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Grant Permission",
                style: "default",
                onPress: () => LocklyModule.requestOverlayPermission()
              }
            ]
          );
          return;
        }
      }
    }

    setAppStates(prev => prev.map(a => 
      a.id === id 
        ? { ...a, isProtected: !a.isProtected, status: !a.isProtected ? 'Protected' : 'Unlocked' }
        : a
    ));
  };

  const getIconSource = (iconPath: string) => {
    if (!iconPath) return null;
    
    // Some versions of react-native-launcher-kit return a base64 string without data prefix
    if (iconPath.startsWith('data:image')) {
      return { uri: iconPath };
    }
    if (iconPath.length > 500 && !iconPath.startsWith('http') && !iconPath.startsWith('file://') && !iconPath.startsWith('/')) {
      return { uri: 'data:image/png;base64,' + iconPath };
    }
    
    if (iconPath.startsWith('http') || iconPath.startsWith('file://')) {
      return { uri: iconPath };
    }
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
    if (app.iconType === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={app.icon} size={24} color={app.iconColor} />;
    } else if (app.iconType === 'Feather') {
      return <Feather name={app.icon} size={24} color={app.iconColor} />;
    } else if (app.iconType === 'FontAwesome5') {
      return <FontAwesome5 name={app.icon} size={20} color={app.iconColor} />;
    }
  };

  const filteredApps = appStates.filter(app => (app?.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()));
  const filteredDeviceApps = deviceApps.filter(
    app => 
      (app?.label || app?.packageName || '').toLowerCase().includes((addAppSearchQuery || '').toLowerCase()) && 
      !appStates.some(addedApp => addedApp.name === (app?.label || app?.packageName || 'Unknown App'))
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top']}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-4 pb-2">
        <View className="flex-row items-center gap-2">
          <Image source={require('../../../assets/images/SantaProtectLogo.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
          <Text className="text-[#2563EB] text-2xl font-bold tracking-tight">SantaProtect</Text>
        </View>
      </View>

      <ScrollView className="flex-1 w-full max-w-4xl self-center px-6 pt-4 pb-20" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-end justify-between mb-2">
          <Text className="text-[#0F172A] text-4xl font-extrabold">My Apps</Text>
        </View>
        <Text className="text-[#64748B] text-sm font-medium mb-6">💡 Tip: Long press an app to remove it</Text>
        
        {/* Search Bar */}
        <View className="flex-row items-center bg-[#EEF2FF] rounded-2xl px-4 py-4 mb-8">
          <Feather name="search" size={22} color="#64748B" />
          <TextInput 
            placeholder="Search apps..." 
            placeholderTextColor="#64748B"
            className="flex-1 ml-3 text-lg text-[#0F172A]"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* App List */}
        <View className="flex-row flex-wrap gap-4 pb-24">
          {filteredApps.map(app => (
            <TouchableOpacity 
              key={app.id} 
              activeOpacity={0.7}
              onLongPress={() => handleRemoveApp(app.id, app.name)}
              className="flex-row items-center justify-between bg-white p-4 rounded-[28px] shadow-sm min-w-[300px] flex-1"
            >
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
            </TouchableOpacity>
          ))}
          {filteredApps.length === 0 && (
            <View className="items-center py-10">
              <Text className="text-[#64748B] text-lg font-medium">No apps found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      {role === 'admin' && (
        <TouchableOpacity 
          className="absolute bottom-6 right-6 w-16 h-16 bg-[#2563EB] rounded-2xl items-center justify-center shadow-lg z-50"
          onPress={() => {
            setModalVisible(true);
            fetchApps();
          }}
        >
          <Feather name="plus" size={32} color="white" />
        </TouchableOpacity>
      )}

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

            <View className="flex-row items-center bg-[#EEF2FF] rounded-2xl px-4 py-4 mb-4">
              <Feather name="search" size={22} color="#64748B" />
              <TextInput 
                placeholder="Search installed apps..." 
                placeholderTextColor="#64748B"
                className="flex-1 ml-3 text-lg text-[#0F172A]"
                value={addAppSearchQuery}
                onChangeText={setAddAppSearchQuery}
              />
            </View>

            {loadingApps ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="text-gray-500 mt-4 text-base font-medium">Loading installed apps...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredDeviceApps}
                keyExtractor={(item) => item.packageName}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                renderItem={({ item }) => {
                  return (
                  <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
                    <View className="flex-row items-center gap-4 flex-1">
                      {item.icon ? (
                        <Image 
                          source={getIconSource(item.icon) || undefined} 
                          className="w-12 h-12 rounded-xl" 
                          resizeMode="contain"
                        />
                      ) : (
                        <View className="w-12 h-12 bg-gray-200 rounded-xl items-center justify-center">
                          <MaterialCommunityIcons name="android" size={24} color="gray" />
                        </View>
                      )}
                      <View className="flex-1 pr-4">
                        <Text className="text-[#0F172A] text-lg font-bold" numberOfLines={1}>{item?.label || item?.packageName || 'Unknown App'}</Text>
                        <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>{item.packageName}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      className="bg-[#EEF2FF] px-4 py-2 rounded-full"
                      onPress={() => handleAddApp(item)}
                    >
                      <Text className="text-[#2563EB] font-bold">Add</Text>
                    </TouchableOpacity>
                  </View>
                )}}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={customAlert.visible}
        onRequestClose={hideAlert}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white w-full max-w-sm p-6 items-center shadow-xl" style={{ borderRadius: 28 }}>
            {/* Dynamic Icon */}
            {customAlert.title === "Remove Application" ? (
              <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
                <Feather name="trash-2" size={28} color="#EF4444" />
              </View>
            ) : customAlert.title === "Already Added" ? (
              <View className="w-16 h-16 bg-amber-50 rounded-full items-center justify-center mb-4">
                <Feather name="alert-triangle" size={28} color="#F59E0B" />
              </View>
            ) : (
              <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4">
                <Feather name="info" size={28} color="#3B82F6" />
              </View>
            )}
            
            <Text className="text-xl font-bold text-[#0F172A] text-center mb-2">{customAlert.title}</Text>
            <Text className="text-[#64748B] text-base text-center mb-8">{customAlert.message}</Text>

            <View className="flex-row flex-wrap gap-3 w-full justify-center">
              {customAlert.buttons ? customAlert.buttons.map((btn, index) => (
                <TouchableOpacity 
                  key={index}
                  activeOpacity={0.7}
                  className="flex-1 items-center justify-center"
                  style={{
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: btn.style === 'cancel' ? '#F1F5F9' : btn.style === 'destructive' ? '#EF4444' : '#2563EB'
                  }}
                  onPress={() => {
                    if (btn.onPress) btn.onPress();
                    hideAlert();
                  }}
                >
                  <Text className={`text-base font-bold ${
                    btn.style === 'cancel' ? 'text-[#475569]' : 'text-white'
                  }`}>{btn.text}</Text>
                </TouchableOpacity>
              )) : (
                <TouchableOpacity 
                  activeOpacity={0.7}
                  className="flex-1 items-center justify-center w-full"
                  style={{ height: 48, borderRadius: 24, backgroundColor: '#2563EB' }}
                  onPress={hideAlert}
                >
                  <Text className="text-white text-base font-bold">Okay</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
