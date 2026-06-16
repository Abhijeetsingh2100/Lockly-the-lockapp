import "../../global.css";
import { Stack, useRouter, useRootNavigationState } from "expo-router";
import { useState, useEffect } from "react";
import { View, ActivityIndicator, Image } from "react-native";
import { SafeStorage } from "../utils/storage";
import PinPad from "../components/PinPad";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from 'expo-linking';
import { NativeModules } from 'react-native';

let RNLauncherKitHelper: any = null;
try {
  RNLauncherKitHelper = require('react-native-launcher-kit').RNLauncherKitHelper;
} catch (e) {}
let LocalAuthentication: any = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch (e) {}
import { AuthProvider } from '../context/AuthContext';
import { TouchableOpacity, Text, BackHandler, AppState, AppStateStatus } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import GuestWifiScreen from '../screens/GuestWifiScreen';

export function ErrorBoundary(props: any) {
  return (
    <View style={{ flex: 1, backgroundColor: 'red', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: 'white' }}>{props.error?.message || 'Unknown error'}</Text>
    </View>
  );
}

export default function RootLayout() {
  const url = Linking.useURL();
  const [isAppReady, setIsAppReady] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [invisiblePassword, setInvisiblePassword] = useState(true);
  
  const [loginRole, setLoginRole] = useState<'none' | 'admin' | 'user'>('none');
  const [lastCancelledUrl, setLastCancelledUrl] = useState<string | null>(null);
  
  // Setup flow state
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [tempPin, setTempPin] = useState('');
  
  // PinPad inputs
  const [currentPin, setCurrentPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();

  useEffect(() => {
    checkPinStatus();

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        const pin = await SafeStorage.getItem('app_pin');
        if (pin) {
          setCurrentPin(''); // Clear the pre-filled PIN
          setErrorMsg('');
          setIsLocked(true);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const rootNavigationState = useRootNavigationState();

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
      const invisPass = await SafeStorage.getItem('app_invisible_password');
      setInvisiblePassword(invisPass !== 'false');
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
        promptMessage: 'Authenticate to unlock SantaProtect'
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

  useEffect(() => {
    const tMatch = url?.match(/t=([^&]+)/);
    const pkgMatch = url?.match(/pkg=([^&]+)/);
    let isDeepLinkLockActive = false;
    
    if (url && url !== lastCancelledUrl && url.includes('locked?pkg=') && tMatch && tMatch[1] && pkgMatch && pkgMatch[1]) {
      const timestamp = parseInt(tMatch[1], 10);
      if (Date.now() - timestamp < 30000) {
        isDeepLinkLockActive = true;
      }
    }

    if (isDeepLinkLockActive) {
      const handleBackPress = () => {
        setLastCancelledUrl(url); // Mark this URL as cancelled so it doesn't loop
        if (NativeModules.LocklyModule) {
          NativeModules.LocklyModule.goToHome();
        }
        return true; 
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => backHandler.remove();
    }
  }, [url, lastCancelledUrl]);

  if (!isAppReady || hasPin === null) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const tMatch = url?.match(/t=([^&]+)/);
  const pkgMatch = url?.match(/pkg=([^&]+)/);
  let isDeepLinkLock = false;
  let targetPkg = '';
  
  if (url && url !== lastCancelledUrl && url.includes('locked?pkg=') && tMatch && tMatch[1] && pkgMatch && pkgMatch[1]) {
    const timestamp = parseInt(tMatch[1], 10);
    if (Date.now() - timestamp < 30000) { // 30 seconds to account for cold boot
      isDeepLinkLock = true;
      targetPkg = pkgMatch[1];
    }
  }

  const handleDeepLinkUnlock = async (pin: string) => {
    try {
      const storedPin = await SafeStorage.getItem('app_pin');
      if (pin === storedPin) {
        if (NativeModules.LocklyModule) {
          await NativeModules.LocklyModule.setUnlockedApp(targetPkg);
        }
        if (targetPkg !== 'com.google.android.packageinstaller' && targetPkg !== 'com.android.packageinstaller' && targetPkg !== 'com.android.settings') {
          RNLauncherKitHelper.launchApplication(targetPkg);
        }
        setTimeout(() => {
          BackHandler.exitApp();
        }, 300);
      } else {
        setErrorMsg('Incorrect PIN. Please try again.');
        setCurrentPin('');
      }
    } catch (e) {
      setErrorMsg('Error checking PIN');
      setCurrentPin('');
    }
  };

  const handleDeepLinkBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access application'
      });
      if (result.success) {
        if (NativeModules.LocklyModule) {
          await NativeModules.LocklyModule.setUnlockedApp(targetPkg);
        }
        if (targetPkg !== 'com.google.android.packageinstaller' && targetPkg !== 'com.android.packageinstaller' && targetPkg !== 'com.android.settings') {
          RNLauncherKitHelper.launchApplication(targetPkg);
        }
        setTimeout(() => {
          BackHandler.exitApp();
        }, 300);
      } else {
        setErrorMsg('Biometric authentication failed');
      }
    } catch (e) {
      setErrorMsg('Error with biometric authentication');
    }
  };

  if (isDeepLinkLock) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <PinPad
          pin={currentPin}
          setPin={(p) => { setCurrentPin(p); setErrorMsg(''); }}
          title="App Locked"
          subtitle="Enter your SantaProtect PIN to access this application"
          error={errorMsg}
          onComplete={handleDeepLinkUnlock}
          showBiometric={biometricEnabled}
          onBiometricPress={handleDeepLinkBiometric}
          invisiblePassword={invisiblePassword}
        />
      </SafeAreaView>
    );
  }

  // If app is not locked, show the standard navigation
  const isUserMode = loginRole === 'user';
  if (!isLocked && (hasPin || isUserMode)) {
    return (
      <AuthProvider initialRole={isUserMode ? 'user' : 'admin'}>
        {isUserMode ? (
          <GuestWifiScreen 
            onBack={() => {
              setLoginRole('none');
              setIsLocked(true);
            }} 
          />
        ) : (
          <Stack screenOptions={{headerShown: false}}/>
        )}
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
        <View className="w-full max-w-sm self-center">
          <View className="items-center mb-12">
            <Image source={require('../../assets/images/SantaProtectLogo.png')} style={{ width: 120, height: 120 }} resizeMode="contain" />
            <Text className="text-4xl font-extrabold text-[#0F172A] mt-4">SantaProtect</Text>
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
          subtitle="Please enter your 6-digit PIN to unlock SantaProtect."
          pin={currentPin}
          setPin={(pin) => {
            setCurrentPin(pin);
            setErrorMsg('');
          }}
          onComplete={handleUnlockPin}
          error={errorMsg}
          showBiometric={biometricEnabled}
          onBiometricPress={handleBiometricUnlock}
          invisiblePassword={invisiblePassword}
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
          invisiblePassword={invisiblePassword}
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
          invisiblePassword={invisiblePassword}
        />
      )}
    </SafeAreaView>
  );
}
