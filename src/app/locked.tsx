import { View, Text, BackHandler, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { InstalledApps } from 'react-native-launcher-kit';
import { useState, useEffect } from 'react';
import PinPad from '../components/PinPad';
import { SafeStorage } from '../utils/storage';

export default function LockedScreen() {
  const { pkg } = useLocalSearchParams();
  const router = useRouter();
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedPin, setSavedPin] = useState<string | null>(null);

  useEffect(() => {
    // Prevent back button from bypassing lock
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    
    // Load the correct PIN
    const loadPin = async () => {
      const pin = await SafeStorage.getItem('user_pin');
      setSavedPin(pin);
    };
    loadPin();

    return () => backHandler.remove();
  }, []);

  const handleVerifyPin = (pin: string) => {
    if (pin === savedPin) {
      // Success! Unlock and launch the target application
      if (pkg) {
        InstalledApps.startApp(pkg.toString());
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
