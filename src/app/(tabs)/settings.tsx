import { View, Text, TouchableOpacity, ScrollView, Switch, Modal, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { SafeStorage, AppStorage } from '../../utils/storage';
import PinPad from '../../components/PinPad';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

let LocalAuthentication: any = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch (e) {}

type AlertButton = { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' | 'default' };

export default function Settings() {
  const router = useRouter();
  const { role } = useAuth();
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [isBiometricSetupVisible, setIsBiometricSetupVisible] = useState(false);
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [tempNewPin, setTempNewPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  // Settings state
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [invisiblePassword, setInvisiblePassword] = useState(true);
  const [uninstallProtection, setUninstallProtection] = useState(false);
  const [autoLockDelay, setAutoLockDelay] = useState(0);
  const [isAutoLockModalVisible, setIsAutoLockModalVisible] = useState(false);
  const [isDisguiseModalVisible, setIsDisguiseModalVisible] = useState(false);
  const [currentDisguise, setCurrentDisguise] = useState('SantaProtect');

  useEffect(() => {
    const loadSettings = async () => {
      const isEnabled = await SafeStorage.getItem('app_biometric');
      setBiometricEnabled(isEnabled === 'true');
      const invisPass = await SafeStorage.getItem('app_invisible_password');
      setInvisiblePassword(invisPass !== 'false'); // default true
      const delay = await SafeStorage.getItem('app_autolock_delay');
      if (delay) {
        setAutoLockDelay(parseInt(delay, 10));
      }
      const disguise = await SafeStorage.getItem('app_disguise');
      if (disguise) {
        setCurrentDisguise(disguise);
      }
      
      const { LocklyModule } = require('react-native').NativeModules;
      const protectionState = await SafeStorage.getItem('app_uninstall_protection');
      const isProtected = protectionState === 'true';
      setUninstallProtection(isProtected);
      if (LocklyModule && LocklyModule.setUninstallProtection) {
        await LocklyModule.setUninstallProtection(isProtected);
      }
    };
    loadSettings();
  }, []);

  const handleAutoLockSelect = async (delayMs: number) => {
    setAutoLockDelay(delayMs);
    setIsAutoLockModalVisible(false);
    await AppStorage.setAutoLockDelay(delayMs);
  };

  const getAutoLockLabel = (delay: number) => {
    if (delay === 0) return 'Immediately';
    if (delay === 60000) return '1 minute';
    if (delay === 300000) return '5 minutes';
    if (delay === 900000) return '15 minutes';
    return 'Immediately';
  };

  const handleSetupBiometric = async () => {
    if (!LocalAuthentication) {
        showAlert("Unsupported", "Biometric authentication is not supported.");
        return;
    }
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        showAlert("Unsupported", "Your device does not support biometric authentication.");
        return;
      }
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        showAlert("Not Enrolled", "Please set up a fingerprint or Face ID in your device settings first.");
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable Biometric Unlock'
      });
      if (result.success) {
        await SafeStorage.setItem('app_biometric', 'true');
        setBiometricEnabled(true);
        showAlert("Success", "Biometric authentication has been enabled.");
        setIsBiometricSetupVisible(false);
      } else {
        showAlert("Failed", "Biometric authentication failed.");
      }
    } catch (error) {
      showAlert("Error", "Something went wrong.");
    }
  };

  const handleDisableBiometric = async () => {
    await SafeStorage.setItem('app_biometric', 'false');
    setBiometricEnabled(false);
    showAlert("Disabled", "Biometric authentication has been disabled.");
    setIsBiometricSetupVisible(false);
  };

  const toggleInvisiblePassword = async (value: boolean) => {
    setInvisiblePassword(value);
    await SafeStorage.setItem('app_invisible_password', value ? 'true' : 'false');
  };

  const handleDisguiseSelect = async (disguise: string) => {
    setCurrentDisguise(disguise);
    await SafeStorage.setItem('app_disguise', disguise);
    setIsDisguiseModalVisible(false);
    
    const { LocklyModule } = require('react-native').NativeModules;
    if (LocklyModule && LocklyModule.changeAppIcon) {
      LocklyModule.changeAppIcon(disguise);
    }
    showAlert("Disguise Applied", `App icon and name will change to ${disguise}. It may take a moment to reflect on your home screen.`);
  };

  const toggleUninstallProtection = async () => {
    const { LocklyModule } = require('react-native').NativeModules;
    if (!LocklyModule) return;
    
    try {
      const newValue = !uninstallProtection;
      if (LocklyModule.setUninstallProtection) {
        await LocklyModule.setUninstallProtection(newValue);
      }
      await SafeStorage.setItem('app_uninstall_protection', newValue ? 'true' : 'false');
      setUninstallProtection(newValue);
      
      if (!newValue && LocklyModule.removeDeviceAdmin) {
         await LocklyModule.removeDeviceAdmin();
      } else if (newValue && LocklyModule.requestDeviceAdmin) {
         await LocklyModule.requestDeviceAdmin();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ... (Pin change logic remains exactly the same)
  const handleStartChangePin = () => {
    setIsChangingPin(true);
    setStep('current');
    setCurrentPinInput('');
    setTempNewPin('');
    setErrorMsg('');
  };

  const handleClose = () => {
    setIsChangingPin(false);
    setCurrentPinInput('');
    setErrorMsg('');
  };

  const handleCurrentPin = async (pin: string) => {
    try {
      const storedPin = await SafeStorage.getItem('app_pin');
      if (pin === storedPin) {
        setStep('new');
        setCurrentPinInput('');
        setErrorMsg('');
      } else {
        setErrorMsg('Incorrect current PIN');
        setCurrentPinInput('');
      }
    } catch (e) {
      setErrorMsg('Error verifying PIN');
      setCurrentPinInput('');
    }
  };

  const handleNewPin = (pin: string) => {
    setTempNewPin(pin);
    setStep('confirm');
    setCurrentPinInput('');
    setErrorMsg('');
  };

  const handleConfirmNewPin = async (pin: string) => {
    if (pin === tempNewPin) {
      try {
        await SafeStorage.setItem('app_pin', pin);
        showAlert("Success", "Your PIN has been updated successfully.");
        handleClose();
      } catch (e) {
        setErrorMsg('Failed to save new PIN');
        setCurrentPinInput('');
      }
    } else {
      setErrorMsg('PINs do not match. Try again.');
      setStep('new');
      setTempNewPin('');
      setCurrentPinInput('');
    }
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <Text className="text-[#2563EB] text-xs font-bold tracking-widest mb-3 ml-1 mt-6 uppercase">{title}</Text>
  );

  const SettingItem = ({ icon, title, value, type, isLast, onPress, onToggle }: any) => (
    <TouchableOpacity 
      activeOpacity={type === 'link' ? 0.7 : 1}
      onPress={type === 'link' ? onPress : undefined}
      className={`flex-row items-center justify-between py-4 ${!isLast ? 'border-b border-blue-100/50' : ''}`}
    >
      <View className="flex-row items-center gap-4">
        <View className="w-10 h-10 bg-blue-100/50 rounded-full items-center justify-center">
          {icon}
        </View>
        <Text className="text-[17px] text-[#1E293B] font-medium">{title}</Text>
      </View>
      
      {type === 'link' && <Feather name="chevron-right" size={20} color="#475569" />}
      {type === 'toggle' && (
        <Switch 
          value={value} 
          onValueChange={onToggle}
          trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
          thumbColor={'#FFFFFF'}
        />
      )}
      {type === 'text' && <Text className="text-[#64748B] text-sm">{value}</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top']}>
      <ScrollView className="flex-1 w-full max-w-4xl self-center px-5" showsVerticalScrollIndicator={false}>
        {/* App Logo Header */}
        <View className="flex-row items-center mt-2 mb-8 gap-2">
          <Image source={require('../../../assets/images/SantaProtectLogo.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
          <Text className="text-[#2563EB] text-xl font-bold">SantaProtect</Text>
        </View>

        <Text className="text-[34px] font-bold text-[#0F172A] mb-2">Settings</Text>

        {/* SECURITY SECTION */}
        {role === 'admin' && (
          <>
            <SectionHeader title="Security" />
            <View className="bg-[#EEF2FF] rounded-3xl px-4 py-2">
              <SettingItem 
                icon={<MaterialCommunityIcons name="form-textbox-password" size={20} color="#475569" />}
                title="Change PIN"
                type="link"
                onPress={handleStartChangePin}
              />
              <SettingItem 
                icon={<Ionicons name="finger-print" size={20} color="#475569" />}
                title="Biometric Authentication"
                type="link"
                onPress={() => setIsBiometricSetupVisible(true)}
              />
              <SettingItem 
                icon={<Feather name="eye-off" size={20} color="#475569" />}
                title="Invisible Password"
                type="toggle"
                value={invisiblePassword}
                onToggle={toggleInvisiblePassword}
              />
              <SettingItem 
                icon={<Feather name="clock" size={20} color="#475569" />}
                title="Auto Lock"
                type="link"
                value={getAutoLockLabel(autoLockDelay)}
                onPress={() => setIsAutoLockModalVisible(true)}
              />
              <SettingItem 
                icon={<Feather name="shield" size={20} color="#475569" />}
                title="Uninstall Protection"
                type="toggle"
                value={uninstallProtection}
                onToggle={toggleUninstallProtection}
              />
              <SettingItem 
                icon={<Feather name="user-x" size={20} color="#475569" />}
                title="Disguise App"
                type="link"
                value={currentDisguise}
                onPress={() => setIsDisguiseModalVisible(true)}
                isLast={true}
              />
            </View>
          </>
        )}



        {/* ABOUT SECTION */}
        <SectionHeader title="About" />
        <View className="bg-[#EEF2FF] rounded-3xl px-4 py-2 mb-10">
          <SettingItem 
            icon={<MaterialCommunityIcons name="shield-check-outline" size={20} color="#475569" />}
            title="Privacy Policy"
            type="link"
            onPress={() => router.push('/privacy')}
          />
          <SettingItem 
            icon={<Feather name="info" size={20} color="#475569" />}
            title="App Version"
            type="text"
            value="v1.0.4"
            isLast={true}
          />
        </View>
      </ScrollView>

      {/* Change PIN Modal (unchanged logic) */}
      <Modal animationType="slide" visible={isChangingPin} onRequestClose={handleClose}>
        <SafeAreaView className="flex-1 bg-[#F8FAFC]">
          <View className="px-6 pt-4 pb-2 items-start">
            <TouchableOpacity onPress={handleClose} className="p-3 bg-gray-100 rounded-full">
              <Feather name="x" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>
          {step === 'current' ? (
            <PinPad title="Current PIN" subtitle="Please enter your current 6-digit PIN." pin={currentPinInput} setPin={(p) => { setCurrentPinInput(p); setErrorMsg(''); }} onComplete={handleCurrentPin} error={errorMsg} invisiblePassword={invisiblePassword} />
          ) : step === 'new' ? (
            <PinPad title="New PIN" subtitle="Enter your new secure 6-digit PIN." pin={currentPinInput} setPin={(p) => { setCurrentPinInput(p); setErrorMsg(''); }} onComplete={handleNewPin} error={errorMsg} invisiblePassword={invisiblePassword} />
          ) : (
            <PinPad title="Confirm New PIN" subtitle="Please re-enter your new PIN to confirm." pin={currentPinInput} setPin={(p) => { setCurrentPinInput(p); setErrorMsg(''); }} onComplete={handleConfirmNewPin} error={errorMsg} invisiblePassword={invisiblePassword} />
          )}
        </SafeAreaView>
      </Modal>

      {/* Biometric Setup Modal */}
      <Modal animationType="slide" visible={isBiometricSetupVisible} onRequestClose={() => setIsBiometricSetupVisible(false)}>
        <SafeAreaView className="flex-1 bg-[#F8FAFC]">
          <View className="px-6 pt-4 pb-2 items-start">
            <TouchableOpacity onPress={() => setIsBiometricSetupVisible(false)} className="p-3 bg-gray-100 rounded-full">
              <Feather name="x" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-24 h-24 bg-blue-50 rounded-full items-center justify-center mb-8">
              <Ionicons name="finger-print" size={48} color="#2563EB" />
            </View>
            <Text className="text-3xl font-extrabold text-[#0F172A] mb-4 text-center">Biometric Unlock</Text>
            <Text className="text-base text-[#64748B] text-center mb-10 leading-relaxed">
              Use your fingerprint or Face ID to quickly and securely unlock SantaProtect without entering your PIN every time.
            </Text>
            
            {biometricEnabled ? (
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={handleDisableBiometric}
                className="w-full bg-red-50 py-4 rounded-full items-center mb-4"
              >
                <Text className="text-red-500 text-lg font-bold">Disable Biometric</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={handleSetupBiometric}
                className="w-full bg-[#2563EB] py-4 rounded-full items-center mb-4 shadow-sm"
              >
                <Text className="text-white text-lg font-bold">Setup Biometric</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
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
            {customAlert.title === "Unsupported" || customAlert.title === "Not Enrolled" || customAlert.title === "Failed" || customAlert.title === "Error" ? (
              <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
                <Feather name="x-circle" size={28} color="#EF4444" />
              </View>
            ) : customAlert.title === "Success" || customAlert.title === "Disabled" ? (
              <View className="w-16 h-16 bg-green-50 rounded-full items-center justify-center mb-4">
                <Feather name="check-circle" size={28} color="#10B981" />
              </View>
            ) : (
              <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4">
                <Feather name="info" size={28} color="#3B82F6" />
              </View>
            )}
            
            <Text className="text-xl font-bold text-[#0F172A] text-center mb-2">{customAlert.title}</Text>
            <Text className="text-[#64748B] text-base text-center mb-8">{customAlert.message}</Text>

            <View className="flex-row gap-3 w-full">
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

      {/* Auto Lock Delay Modal */}
      <Modal animationType="slide" visible={isAutoLockModalVisible} onRequestClose={() => setIsAutoLockModalVisible(false)} transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[32px] p-6 pb-12">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-[#0F172A]">Auto Lock Delay</Text>
              <TouchableOpacity onPress={() => setIsAutoLockModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                <Feather name="x" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <Text className="text-[#64748B] text-base mb-6">
              Select how much time after closing a locked app before it requires unlocking again.
            </Text>
            
            {[
              { label: 'Immediately', value: 0 },
              { label: '1 minute', value: 60000 },
              { label: '5 minutes', value: 300000 },
              { label: '15 minutes', value: 900000 }
            ].map((option) => (
              <TouchableOpacity 
                key={option.value}
                activeOpacity={0.7}
                onPress={() => handleAutoLockSelect(option.value)}
                className="flex-row items-center justify-between py-4 border-b border-gray-100"
              >
                <Text className="text-[#1E293B] text-lg font-medium">{option.label}</Text>
                {autoLockDelay === option.value && (
                  <Feather name="check" size={24} color="#2563EB" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Disguise Modal */}
      <Modal animationType="slide" visible={isDisguiseModalVisible} onRequestClose={() => setIsDisguiseModalVisible(false)} transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[32px] p-6 pb-12">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-[#0F172A]">Disguise Application</Text>
              <TouchableOpacity onPress={() => setIsDisguiseModalVisible(false)} className="bg-gray-100 p-2 rounded-full">
                <Feather name="x" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <Text className="text-[#64748B] text-base mb-6">
              Select an icon and name to disguise SantaProtect on your device.
            </Text>
            
            {[
              { label: 'SantaProtect (Default)', value: 'SantaProtect', icon: 'shield-check' },
              { label: 'Calculator', value: 'Calculator', icon: 'calculator' },
              { label: 'Weather', value: 'Weather', icon: 'weather-cloudy' },
              { label: 'Calendar', value: 'Calendar', icon: 'calendar-month' },
            ].map((option) => (
              <TouchableOpacity 
                key={option.value}
                activeOpacity={0.7}
                onPress={() => handleDisguiseSelect(option.value)}
                className="flex-row items-center justify-between py-4 border-b border-gray-100"
              >
                <View className="flex-row items-center gap-3">
                  <MaterialCommunityIcons name={option.icon as any} size={24} color="#475569" />
                  <Text className="text-[#1E293B] text-lg font-medium">{option.label}</Text>
                </View>
                {currentDisguise === option.value && (
                  <Feather name="check" size={24} color="#2563EB" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
