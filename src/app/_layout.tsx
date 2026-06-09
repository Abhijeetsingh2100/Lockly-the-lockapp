import "../../global.css";
import { Stack, useRouter, useRootNavigationState } from "expo-router";
import { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeStorage } from "../utils/storage";
import PinPad from "../components/PinPad";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from 'expo-linking';
import * as LocalAuthentication from 'expo-local-authentication';

export default function RootLayout() {
  const url = Linking.useURL();
  const [isAppReady, setIsAppReady] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
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
  if ((!isLocked && hasPin) || isDeepLinkLock) {
    return <Stack screenOptions={{headerShown: false}}/>;
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
