import { View, Text, BackHandler, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { RNLauncherKitHelper } from 'react-native-launcher-kit';
import { useState, useEffect } from 'react';
import PinPad from '../components/PinPad';
import { SafeStorage } from '../utils/storage';
import { NativeModules } from 'react-native';

const { LocklyModule } = NativeModules;

export default function LockedScreen() {
  const { pkg } = useLocalSearchParams();
  const router = useRouter();
  const url = Linking.useURL();
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedPin, setSavedPin] = useState<string | null>(null);

  useEffect(() => {
    // Prevent back button from bypassing lock
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    
    // Load the correct PIN
    const loadPin = async () => {
      const pin = await SafeStorage.getItem('app_pin');
      setSavedPin(pin);
    };
    loadPin();

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    // If Expo Router automatically navigated here due to a stale deep link (e.g. from Recent Apps),
    // we must immediately redirect the user back to the main tabs.
    if (url && url.includes('locked?pkg=')) {
      const tMatch = url.match(/t=([^&]+)/);
      if (tMatch && tMatch[1]) {
        const timestamp = parseInt(tMatch[1], 10);
        if (Date.now() - timestamp >= 30000) {
          router.replace('/');
        }
      }
    }
  }, [url]);

  const handleVerifyPin = async (pin: string) => {
    if (pin === savedPin) {
      // Success! Unlock and launch the target application
      if (pkg) {
        if (LocklyModule) {
          await LocklyModule.setUnlockedApp(pkg.toString());
        }
        RNLauncherKitHelper.launchApplication(pkg.toString());
        router.replace('/');
        setTimeout(() => {
          BackHandler.exitApp();
        }, 500);
      } else {
        BackHandler.exitApp();
      }
    } else {
      setErrorMsg('Incorrect PIN. Please try again.');
      setEnteredPin('');
    }
  };

  if (!savedPin) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <PinPad
        pin={enteredPin}
        setPin={setEnteredPin}
        title="App Locked"
        subtitle="Enter your Lockly PIN to access this application"
        error={errorMsg}
        onComplete={handleVerifyPin}
      />
    </SafeAreaView>
  );
}
