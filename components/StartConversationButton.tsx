import React, { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMessages } from '@/hooks/messages-store';
import { useAuth } from '@/hooks/auth-store';
import Colors from '@/constants/colors';
import Button from './Button';

interface StartConversationButtonProps {
  userId: string;
  userName: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'outline' | 'ghost';
  style?: any;
}

export default function StartConversationButton({ 
  userId, 
  userName,
  size = 'medium',
  variant = 'outline',
  style 
}: StartConversationButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { createConversation } = useMessages();
  const [loading, setLoading] = useState(false);

  const handleStartConversation = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to start a conversation');
      return;
    }

    if (userId === user.id) {
      Alert.alert('Invalid Action', 'You cannot start a conversation with yourself');
      return;
    }

    try {
      setLoading(true);

      // Create or get existing private conversation
      const conversationId = await createConversation({
        type: 'private',
        participant_ids: [userId],
      });

      if (conversationId) {
        // Navigate to the conversation
        router.push({
          pathname: '/chat/[id]',
          params: { 
            id: conversationId,
            title: userName,
          }
        });
      }

    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      title="Message"
      onPress={handleStartConversation}
      disabled={loading}
      loading={loading}
      size={size}
      variant={variant}
      leftIcon={<Ionicons name="chatbubble" size={16} color={
        variant === 'primary' ? 'white' : Colors.primary
      } />}
      style={[styles.button, style]}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 100,
  },
});