import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Switch, ActivityIndicator, TextInput, Modal, Alert, NativeModules, PermissionsAndroid, Platform, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

let WifiManager: any = null;
try {
  WifiManager = require('react-native-wifi-reborn').default;
} catch (e) {}

export default function GuestWifiScreen({ onBack }: { onBack?: () => void }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [networks, setNetworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSSID, setCurrentSSID] = useState<string | null>(null);

  const [selectedNetwork, setSelectedNetwork] = useState<any | null>(null);
  const [password, setPassword] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkWifiStatus();
    
    const backAction = () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
    return () => {
      backHandler.remove();
    };
  }, [onBack]);

  const checkWifiStatus = async () => {
    if (!WifiManager) return;
    try {
      const enabled = await WifiManager.isEnabled();
      setIsEnabled(enabled);
      if (enabled) {
        scanNetworks();
      }
      try {
        const ssid = await WifiManager.getCurrentWifiSSID();
        setCurrentSSID(ssid);
      } catch (e) {
        setCurrentSSID(null);
      }
    } catch (e) {
      console.log('Failed to get wifi status', e);
    }
  };

  const scanNetworks = async () => {
    if (!WifiManager) return;
    setLoading(true);
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'SantaProtect needs location permission to scan for Wi-Fi networks.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Permission Denied", "Cannot scan for networks without location permission.");
          setLoading(false);
          return;
        }
      }

      const list = await WifiManager.loadWifiList();
      setNetworks(list);
      try {
        const ssid = await WifiManager.getCurrentWifiSSID();
        setCurrentSSID(ssid);
      } catch (e) {
        setCurrentSSID(null);
      }
    } catch (e) {
      console.log('Failed to scan networks', e);
      Alert.alert("Error", "Could not scan for Wi-Fi networks. Please ensure Location permissions are granted.");
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    if (!selectedNetwork || !WifiManager) return;
    setConnecting(true);
    
    const isSecure = selectedNetwork.capabilities?.toUpperCase().includes('WPA') || 
                     selectedNetwork.capabilities?.toUpperCase().includes('WEP');

    try {
      if (isSecure) {
        await WifiManager.connectToProtectedSSID(selectedNetwork.SSID, password, false, false);
      } else {
        await WifiManager.connectToSSID(selectedNetwork.SSID);
      }
      Alert.alert("Success", `Connected to ${selectedNetwork.SSID}`);
      setIsModalVisible(false);
      setPassword('');
      scanNetworks();
    } catch (e) {
      console.log('Connection failed', e);
      Alert.alert("Error", "Failed to connect to the network. Please check your credentials.");
    }
    setConnecting(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top']}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-4 pb-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons name="wifi" size={28} color="#2563EB" />
          <Text className="text-[#2563EB] text-2xl font-bold tracking-tight">Guest Wi-Fi</Text>
        </View>
      </View>

      <View className="flex-1 px-6 pt-6">
        <Text className="text-3xl font-extrabold text-[#0F172A] mb-2">Wi-Fi Settings</Text>
        <Text className="text-[#64748B] text-base mb-8">
          Manage your Wi-Fi connection directly from here.
        </Text>

        <View className="bg-white rounded-[28px] p-5 shadow-sm mb-6 border border-gray-50 flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <View className={`w-12 h-12 rounded-full items-center justify-center ${isEnabled ? 'bg-blue-50' : 'bg-gray-100'}`}>
              <Feather name="wifi" size={24} color={isEnabled ? "#2563EB" : "#94A3B8"} />
            </View>
            <View>
              <Text className="text-[#0F172A] text-lg font-bold">Wi-Fi</Text>
              <Text className="text-[#64748B] text-sm font-medium">{isEnabled ? 'On' : 'Off'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={checkWifiStatus} className="p-2">
            <Feather name="refresh-cw" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {!isEnabled && (
          <View className="bg-amber-50 rounded-2xl p-4 border border-amber-100 mb-6 flex-row items-center gap-3">
            <Feather name="info" size={24} color="#D97706" />
            <Text className="text-[#D97706] text-sm flex-1 font-medium leading-5">
              Wi-Fi is currently disabled. To enable it, please swipe down from the top of your screen and turn on Wi-Fi from the Quick Settings menu.
            </Text>
          </View>
        )}

        {isEnabled && (
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-4 mt-2">
              <Text className="text-[#1E293B] text-lg font-bold ml-1">Available Networks</Text>
            </View>

            {loading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="text-[#64748B] mt-4">Scanning networks...</Text>
              </View>
            ) : networks.length === 0 ? (
              <View className="flex-1 justify-center items-center">
                <MaterialCommunityIcons name="wifi-off" size={48} color="#CBD5E1" />
                <Text className="text-[#64748B] mt-4 text-center px-8">No networks found. Try refreshing or check if you are within range.</Text>
              </View>
            ) : (
              <FlatList
                data={networks}
                keyExtractor={(item, index) => item.BSSID + index}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
                renderItem={({ item }) => {
                  const isCurrent = currentSSID === item.SSID;
                  return (
                    <TouchableOpacity 
                      activeOpacity={0.7}
                      onPress={() => {
                        if (!isCurrent) {
                          setSelectedNetwork(item);
                          setIsModalVisible(true);
                        }
                      }}
                      className={`flex-row items-center justify-between p-4 rounded-2xl ${isCurrent ? 'bg-blue-50 border border-blue-100' : 'bg-white border border-gray-50 shadow-sm'}`}
                    >
                      <View className="flex-row items-center gap-4">
                        <Feather name="wifi" size={24} color={isCurrent ? "#2563EB" : "#475569"} />
                        <View>
                          <Text className={`text-base font-bold ${isCurrent ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>
                            {item.SSID || "Hidden Network"}
                          </Text>
                          {isCurrent && <Text className="text-[#2563EB] text-xs font-semibold mt-1">Connected</Text>}
                        </View>
                      </View>
                      {!isCurrent && <Feather name="chevron-right" size={20} color="#CBD5E1" />}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        )}
      </View>

      <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white w-full rounded-[28px] p-6 shadow-xl">
            <Text className="text-xl font-bold text-[#0F172A] mb-2">Connect to {selectedNetwork?.SSID}</Text>
            <Text className="text-[#64748B] text-sm mb-6">Enter the password for this Wi-Fi network.</Text>

            {selectedNetwork && (selectedNetwork.capabilities?.toUpperCase().includes('WPA') || selectedNetwork.capabilities?.toUpperCase().includes('WEP')) ? (
              <View className="bg-[#F1F5F9] rounded-xl px-4 py-3 flex-row items-center mb-8 border border-gray-200">
                <Feather name="lock" size={20} color="#64748B" />
                <TextInput
                  className="flex-1 ml-3 text-base text-[#0F172A]"
                  placeholder="Password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  autoFocus
                />
              </View>
            ) : (
              <View className="mb-8">
                <Text className="text-[#64748B] text-base">This is an open network. No password is required.</Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => { setIsModalVisible(false); setPassword(''); }}
                className="flex-1 py-3 bg-gray-100 rounded-full items-center"
              >
                <Text className="text-[#475569] font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={handleConnect}
                disabled={connecting || ((selectedNetwork?.capabilities?.toUpperCase().includes('WPA') || selectedNetwork?.capabilities?.toUpperCase().includes('WEP')) && password.length === 0)}
                className={`flex-1 py-3 rounded-full items-center ${connecting || ((selectedNetwork?.capabilities?.toUpperCase().includes('WPA') || selectedNetwork?.capabilities?.toUpperCase().includes('WEP')) && password.length === 0) ? 'bg-blue-300' : 'bg-[#2563EB]'}`}
              >
                {connecting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-bold">Connect</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}