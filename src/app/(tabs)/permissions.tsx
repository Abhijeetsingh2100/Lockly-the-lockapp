import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Permissions() {
  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <View className="flex-1 justify-center items-center">
        <Text className="text-2xl font-bold text-[#0F172A]">Permissions</Text>
      </View>
    </SafeAreaView>
  );
}
