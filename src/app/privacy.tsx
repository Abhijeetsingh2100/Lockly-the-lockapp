import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PrivacyPolicy() {
  const router = useRouter();

  const PolicySection = ({ title, content }: { title: string, content: string }) => (
    <View className="mb-6">
      <Text className="text-[#0F172A] text-lg font-bold mb-2">{title}</Text>
      <Text className="text-[#475569] text-[15px] leading-relaxed">{content}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 items-center justify-center bg-white rounded-full shadow-sm"
        >
          <Feather name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#0F172A] ml-4">Privacy Policy</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-4 pb-10" showsVerticalScrollIndicator={false}>
        <View className="items-center mb-8 mt-2">
          <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-4">
            <MaterialCommunityIcons name="shield-lock-outline" size={40} color="#2563EB" />
          </View>
          <Text className="text-2xl font-extrabold text-[#0F172A] text-center">SantaProtect Privacy Policy</Text>
          <Text className="text-[#64748B] text-sm mt-2">Last Updated: June 10, 2026</Text>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-sm mb-10">
          <PolicySection 
            title="1. Introduction" 
            content="Welcome to SantaProtect. We are committed to protecting your personal information and your right to privacy. This policy explains what information we collect, how we use it, and your rights." 
          />
          
          <PolicySection 
            title="2. Accessibility Services" 
            content="SantaProtect uses the Android Accessibility Service API to detect when you launch an application. This is strictly used to provide the app locking functionality by identifying the package name of the active window and displaying our lock screen when a protected app is opened. We do not use this permission to read your screen content, monitor your keystrokes, or collect any personal data." 
          />

          <PolicySection 
            title="3. Data Collection" 
            content="SantaProtect is designed with a privacy-first approach. All your data, including your PIN, protected applications list, and biometric settings, are stored locally and securely on your device. We do not transmit any of this data to external servers." 
          />

          <PolicySection 
            title="4. Biometric Authentication" 
            content="If you enable Biometric Unlock, SantaProtect relies on your device's native biometric hardware (Fingerprint or Face ID). SantaProtect receives a simple success or failure signal and does not have access to your raw biometric data." 
          />

          <PolicySection 
            title="5. Changes to This Policy" 
            content="We may update our Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by updating the date at the top of this policy." 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
