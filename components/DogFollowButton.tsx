import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import Button from './Button';

interface DogFollowButtonProps {
  isFollowing: boolean;
  onToggleFollow: () => Promise<boolean>;
  disabled: boolean;
  loading: boolean;
}

export default function DogFollowButton({ 
  isFollowing, 
  onToggleFollow, 
  disabled, 
  loading 
}: DogFollowButtonProps) {
  const handlePress = async () => {
    try {
      await onToggleFollow();
    } catch (error) {
      console.error('Error in follow button:', error?.message || error);
    }
  };

  return (
    <Button
      title={isFollowing ? 'Following' : 'Follow'}
      onPress={handlePress}
      disabled={disabled || loading}
      loading={loading}
      leftIcon={
        <Ionicons 
          name={isFollowing ? 'eye' : 'eye-outline'} 
          size={16} 
          color={isFollowing ? Colors.success : 'white'} 
        />
      }
      style={[
        styles.button,
        isFollowing && styles.followingButton
      ]}
      variant={isFollowing ? 'outline' : 'primary'}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  followingButton: {
    borderColor: Colors.success,
  },
});