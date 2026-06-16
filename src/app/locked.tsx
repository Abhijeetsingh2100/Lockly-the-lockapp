import { View, Text, BackHandler, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import { RNLauncherKitHelper } from 'react-native-launcher-kit';
import { useState, useEffect, useCallback } from 'react';
import PinPad from '../components/PinPad';
import { SafeStorage } from '../utils/storage';
import { NativeModules } from 'react-native';

let LocalAuthentication: any = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch (e) {}

const { LocklyModule } = NativeModules;

export default function LockedScreen() {
  const { pkg } = useLocalSearchParams();
  const router = useRouter();
  const url = Linking.useURL();
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [invisiblePassword, setInvisiblePassword] = useState(true);
  const [hasMasterPin, setHasMasterPin] = useState(false);
  const [isMasterPinMode, setIsMasterPinMode] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setEnteredPin('');
      setErrorMsg('');
    }, [])
  );

  useEffect(() => {
    // Prevent back button from bypassing lock
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    
    // Load the correct PIN
    const loadPin = async () => {
      const pin = await SafeStorage.getItem('app_pin');
      setSavedPin(pin);
      const biometric = await SafeStorage.getItem('app_biometric');
      setBiometricEnabled(biometric === 'true');
      const invisPass = await SafeStorage.getItem('app_invisible_password');
      setInvisiblePassword(invisPass !== 'false');
      
      const storedMasterPin = await SafeStorage.getItem('app_master_pin');
      setHasMasterPin(!!storedMasterPin);
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
    const targetPin = isMasterPinMode ? await SafeStorage.getItem('app_master_pin') : savedPin;
    if (pin === targetPin) {
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
      setErrorMsg(isMasterPinMode ? 'Incorrect Master Password. Please try again.' : 'Incorrect PIN. Please try again.');
      setEnteredPin('');
    }
  };

  const handleBiometricUnlock = async () => {
    if (!LocalAuthentication) return;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access application'
      });
      if (result.success) {
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
        setErrorMsg('Biometric authentication failed');
      }
    } catch (e) {
      setErrorMsg('Error with biometric authentication');
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
        title={isMasterPinMode ? "Enter Master Password" : "App Locked"}
        subtitle={isMasterPinMode ? "Please enter your master password to access this application" : "Enter your SantaProtect PIN to access this application"}
        error={errorMsg}
        onComplete={handleVerifyPin}
        showBiometric={!isMasterPinMode && biometricEnabled}
        onBiometricPress={handleBiometricUnlock}
        invisiblePassword={isMasterPinMode ? true : invisiblePassword}
        onUseMasterPassword={(!isMasterPinMode && hasMasterPin) ? () => {
          setIsMasterPinMode(true);
          setEnteredPin('');
          setErrorMsg('');
        } : undefined}
      />
    </SafeAreaView>
  );
}
