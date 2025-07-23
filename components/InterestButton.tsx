import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/auth-store';

type InterestType = 'adoption' | 'foster' | 'sponsor' | 'favorite';

interface InterestButtonProps {
  dogId: string;
  userInterests: InterestType[];
  onInterestChange: (interestType: InterestType, isActive: boolean, notes?: string) => void;
  style?: any;
}

interface InterestOption {
  type: InterestType;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  description: string;
}

const interestOptions: InterestOption[] = [
  {
    type: 'favorite',
    icon: 'heart',
    label: 'Favorite',
    color: '#EF4444',
    description: 'Add to your favorites to follow updates'
  },
  {
    type: 'adoption',
    icon: 'home',
    label: 'Adopt',
    color: '#10B981',
    description: 'I want to adopt this dog'
  },
  {
    type: 'foster',
    icon: 'time',
    label: 'Foster',
    color: '#F59E0B',
    description: 'I can provide temporary care'
  },
  {
    type: 'sponsor',
    icon: 'card',
    label: 'Sponsor',
    color: '#8B5CF6',
    description: 'I want to help with medical/food costs'
  },
];

export default function InterestButton({ dogId, userInterests, onInterestChange, style }: InterestButtonProps) {
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState<InterestType | null>(null);
  const [notes, setNotes] = useState('');

  const handleInterestToggle = (interestType: InterestType) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to express interest in dogs.');
      return;
    }

    const isActive = userInterests.includes(interestType);
    
    if (isActive) {
      // Remove interest
      onInterestChange(interestType, false);
    } else {
      // Show modal for adding interest with notes
      setSelectedInterest(interestType);
      setNotes('');
      setModalVisible(true);
    }
  };

  const handleSubmitInterest = () => {
    if (selectedInterest) {
      onInterestChange(selectedInterest, true, notes);
      setModalVisible(false);
      setSelectedInterest(null);
      setNotes('');
    }
  };

  const getMainButtonIcon = () => {
    if (userInterests.includes('favorite')) return 'heart';
    if (userInterests.includes('adoption')) return 'home';
    if (userInterests.includes('foster')) return 'time';
    if (userInterests.includes('sponsor')) return 'card';
    return 'heart-outline';
  };

  const getMainButtonColor = () => {
    if (userInterests.includes('adoption')) return '#10B981';
    if (userInterests.includes('foster')) return '#F59E0B';
    if (userInterests.includes('sponsor')) return '#8B5CF6';
    if (userInterests.includes('favorite')) return '#EF4444';
    return '#6B7280';
  };

  return (
    <View style={style}>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="flex-row items-center bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm"
      >
        <Ionicons 
          name={getMainButtonIcon()} 
          size={20} 
          color={getMainButtonColor()} 
        />
        <Text className="ml-2 font-medium text-gray-700">
          {userInterests.length > 0 ? `Interested (${userInterests.length})` : 'Show Interest'}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-96">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">
                Show Interest
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="space-y-3">
              {interestOptions.map((option) => {
                const isActive = userInterests.includes(option.type);
                return (
                  <TouchableOpacity
                    key={option.type}
                    onPress={() => handleInterestToggle(option.type)}
                    className={`flex-row items-center p-4 rounded-xl border-2 ${
                      isActive 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3`}
                          style={{ backgroundColor: isActive ? option.color : '#F3F4F6' }}>
                      <Ionicons 
                        name={isActive ? option.icon : `${option.icon}-outline` as any} 
                        size={20} 
                        color={isActive ? 'white' : option.color} 
                      />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-semibold ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                        {option.label}
                      </Text>
                      <Text className={`text-sm ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                        {option.description}
                      </Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedInterest && (
              <View className="mt-6 p-4 bg-gray-50 rounded-xl">
                <Text className="font-medium text-gray-900 mb-2">
                  Add a note (optional)
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Why are you interested in this dog?"
                  multiline
                  numberOfLines={3}
                  className="bg-white border border-gray-300 rounded-lg p-3 text-gray-900"
                  maxLength={500}
                />
                <View className="flex-row mt-4 space-x-3">
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      setSelectedInterest(null);
                    }}
                    className="flex-1 bg-gray-200 rounded-lg py-3"
                  >
                    <Text className="text-center font-medium text-gray-700">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmitInterest}
                    className="flex-1 bg-blue-500 rounded-lg py-3"
                  >
                    <Text className="text-center font-medium text-white">Submit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}