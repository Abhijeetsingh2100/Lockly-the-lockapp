import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

interface PinPadProps {
  pin: string;
  setPin: (pin: string) => void;
  title: string;
  subtitle?: string;
  onComplete: (finalPin: string) => void;
  error?: string;
  showBiometric?: boolean;
  onBiometricPress?: () => void;
  invisiblePassword?: boolean;
}

export default function PinPad({ pin, setPin, title, subtitle, onComplete, error, showBiometric, onBiometricPress, invisiblePassword }: PinPadProps) {
  const handlePress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 6) {
        onComplete(newPin);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < 6; i++) {
      dots.push(
        <View 
          key={i} 
          style={{
            width: 16, height: 16, borderRadius: 8, marginHorizontal: 8,
            backgroundColor: error ? '#EF4444' : ((i < pin.length) ? '#2563EB' : '#E2E8F0')
          }}
        />
      );
    }
    return <View className="flex-row justify-center mb-10">{dots}</View>;
  };

  const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];

  return (
    <View className="flex-1 items-center justify-center w-full px-6 pb-12">
      <View className="items-center mb-12">
        <View className="bg-blue-50 items-center justify-center mb-6" style={{ width: 80, height: 80, borderRadius: 40 }}>
          <Image source={require('../../assets/images/SantaProtectLogo.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
        </View>
        <Text className="text-3xl font-extrabold text-[#0F172A] mb-2">{title}</Text>
        {subtitle ? <Text className="text-base text-[#64748B] text-center px-4">{subtitle}</Text> : null}
        {error ? <Text className="text-base text-red-500 font-bold text-center mt-2 px-4">{error}</Text> : null}
      </View>

      {renderDots()}

      <View 
        className="w-full flex-row justify-between" 
        style={{ maxWidth: 300, flexWrap: 'wrap', rowGap: 24 }}
      >
        {buttons.map((btn, index) => {
          if (btn === '') {
            if (showBiometric && onBiometricPress) {
              return (
                <TouchableOpacity 
                  key={index} 
                  activeOpacity={invisiblePassword ? 1 : 0.7}
                  onPress={onBiometricPress}
                  className="items-center justify-center bg-gray-50"
                  style={{ width: 85, height: 85, borderRadius: 45 }}
                >
                  <Ionicons name="finger-print" size={32} color="#2563EB" />
                </TouchableOpacity>
              );
            }
            return <View key={index} style={{ width: 85, height: 85 }} />;
          }
          if (btn === 'delete') {
            return (
              <TouchableOpacity 
                key={index} 
                activeOpacity={invisiblePassword ? 1 : 0.7}
                onPress={handleBackspace}
                className="items-center justify-center bg-gray-50"
                style={{ width: 85, height: 85, borderRadius: 45 }}
              >
                <Feather name="delete" size={28} color="#0F172A" />
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity 
              key={index} 
              activeOpacity={invisiblePassword ? 1 : 0.7}
              onPress={() => handlePress(btn)}
              className="items-center justify-center bg-white border border-gray-100 shadow-sm"
              style={{ width: 85, height: 85, borderRadius: 45 }}
            >
              <Text className="text-3xl font-bold text-[#0F172A]">{btn}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
