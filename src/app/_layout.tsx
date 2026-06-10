import "../../global.css";
import { Stack, useRouter, useRootNavigationState } from "expo-router";
import { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeStorage } from "../utils/storage";
import PinPad from "../components/PinPad";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from 'expo-linking';
import * as LocalAuthentication from 'expo-local-authentication';
import { AuthProvider } from '../context/AuthContext';
import { TouchableOpacity, Text } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import GuestWifiScreen from '../screens/GuestWifiScreen';

export default function RootLayout() {
  const url = Linking.useURL();
  const [isAppReady, setIsAppReady] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  const [loginRole, setLoginRole] = useState<'none' | 'admin' | 'user'>('none');
  
  // Setup flow state
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [tempPin, setTempPin] = useState('');
  
  // PinPad inputs
  const [currentPin, setCurrentPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();

  useEffect(() => {
    checkPinStatus();
  }, []);

  const rootNavigationState = useRootNavigationState();
  
  useEffect(() => {
    // Only navigate after the Root Layout has fully mounted its navigator
    if (!rootNavigationState?.key) return;

    if (isAppReady && url && url.includes('locked?pkg=')) {
      const tMatch = url.match(/t=([^&]+)/);
      const pkgMatch = url.match(/pkg=([^&]+)/);
      
      if (tMatch && tMatch[1] && pkgMatch && pkgMatch[1]) {
        const timestamp = parseInt(tMatch[1], 10);
        // If the deep link is fresh (less than 30s old), explicitly force the router to the locked screen
        if (Date.now() - timestamp < 30000) {
          router.replace(`/locked?pkg=${pkgMatch[1]}`);
        }
      }
    }
  }, [rootNavigationState?.key, url, isAppReady]);

  const checkPinStatus = async () => {
    try {
      const storedPin = await SafeStorage.getItem('app_pin');
      if (storedPin) {
        setHasPin(true);
      } else {
        setHasPin(false);
      }
      const biometric = await SafeStorage.getItem('app_biometric');
      setBiometricEnabled(biometric === 'true');
    } catch (e) {
      console.log('Error checking pin status', e);
      setHasPin(false);
    } finally {
      setIsAppReady(true);
    }
  };

  const handleCreatePin = (pin: string) => {
    setTempPin(pin);
    setCurrentPin('');
    setSetupStep('confirm');
    setErrorMsg('');
  };

  const handleConfirmPin = async (pin: string) => {
    if (pin === tempPin) {
      try {
        await SafeStorage.setItem('app_pin', pin);
        setHasPin(true);
        setIsLocked(false);
      } catch (e) {
        setErrorMsg('Failed to save PIN');
        setCurrentPin('');
      }
    } else {
      setErrorMsg('PINs do not match. Try again.');
      setSetupStep('create');
      setTempPin('');
      setCurrentPin('');
    }
  };

  const handleUnlockPin = async (pin: string) => {
    try {
      const storedPin = await SafeStorage.getItem('app_pin');
      if (pin === storedPin) {
        setIsLocked(false);
      } else {
        setErrorMsg('Incorrect PIN');
        setCurrentPin('');
      }
    } catch (e) {
      setErrorMsg('Error checking PIN');
      setCurrentPin('');
    }
  };

  const handleBiometricUnlock = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to unlock Lockly'
      });
      if (result.success) {
        setIsLocked(false);
      } else {
        setErrorMsg('Biometric authentication failed');
      }
    } catch (e) {
      setErrorMsg('Error with biometric authentication');
    }
  };

  if (!isAppReady || hasPin === null) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const tMatch = url?.match(/t=([^&]+)/);
  let isDeepLinkLock = false;
  if (url?.includes('locked?pkg=') && tMatch && tMatch[1]) {
    const timestamp = parseInt(tMatch[1], 10);
    if (Date.now() - timestamp < 30000) { // 30 seconds to account for cold boot
      isDeepLinkLock = true;
    }
  }

  // If app is not locked or it's a deep link lock for another app, show the standard navigation
  const isUserMode = loginRole === 'user';
  if ((!isLocked && (hasPin || isUserMode)) || isDeepLinkLock) {
    return (
      <AuthProvider initialRole={isUserMode ? 'user' : 'admin'}>
        {isUserMode ? <GuestWifiScreen /> : <Stack screenOptions={{headerShown: false}}/>}
      </AuthProvider>
    );
  }

  const handleUserLogin = () => {
    setLoginRole('user');
    setIsLocked(false);
  };

  const handleAdminLogin = () => {
    setLoginRole('admin');
  };

  if (loginRole === 'none') {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC] justify-center px-6">
        <View className="items-center mb-12">
          <MaterialCommunityIcons name="shield-check" size={64} color="#2563EB" />
          <Text className="text-4xl font-extrabold text-[#0F172A] mt-4">Lockly</Text>
          <Text className="text-[#64748B] text-base mt-2">Select your login role</Text>
        </View>

        <View className="gap-4">
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={handleAdminLogin}
            className="w-full bg-[#2563EB] py-4 rounded-2xl items-center flex-row justify-center gap-2 shadow-sm"
          >
            <Feather name="shield" size={24} color="white" />
            <Text className="text-white text-lg font-bold">Admin Login</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={handleUserLogin}
            className="w-full bg-[#EEF2FF] py-4 rounded-2xl items-center flex-row justify-center gap-2"
          >
            <Feather name="user" size={24} color="#2563EB" />
            <Text className="text-[#2563EB] text-lg font-bold">User Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Lock Screen Overlay
  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      {hasPin ? (
        <PinPad
          title="Enter PIN"
          subtitle="Please enter your 6-digit PIN to unlock Lockly."
          pin={currentPin}
          setPin={(pin) => {
            setCurrentPin(pin);
            setErrorMsg('');
          }}
          onComplete={handleUnlockPin}
          error={errorMsg}
          showBiometric={biometricEnabled}
          onBiometricPress={handleBiometricUnlock}
        />
      ) : setupStep === 'create' ? (
        <PinPad
          title="Create PIN"
          subtitle="Set a secure 6-digit PIN to protect your applications."
          pin={currentPin}
          setPin={(pin) => {
            setCurrentPin(pin);
            setErrorMsg('');
          }}
          onComplete={handleCreatePin}
          error={errorMsg}
        />
      ) : (
        <PinPad
          title="Confirm PIN"
          subtitle="Please re-enter your new PIN to confirm."
          pin={currentPin}
          setPin={(pin) => {
            setCurrentPin(pin);
            setErrorMsg('');
          }}
          onComplete={handleConfirmPin}
          error={errorMsg}
        />
      )}
    </SafeAreaView>
  );
}
