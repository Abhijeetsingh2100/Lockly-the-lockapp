import "../../global.css";
import { Stack } from "expo-router";
import { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeStorage } from "../utils/storage";
import PinPad from "../components/PinPad";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  
  // Setup flow state
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [tempPin, setTempPin] = useState('');
  
  // PinPad inputs
  const [currentPin, setCurrentPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    try {
      const storedPin = await SafeStorage.getItem('app_pin');
      if (storedPin) {
        setHasPin(true);
      } else {
        setHasPin(false);
      }
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

  if (!isAppReady || hasPin === null) {
    return (
      <View className="flex-1 bg-[#F8FAFC] items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // If app is not locked, show the standard navigation
  if (!isLocked && hasPin) {
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
