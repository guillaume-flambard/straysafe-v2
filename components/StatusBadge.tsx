import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DogStatus } from '@/types';
import Colors from '@/constants/colors';

interface StatusBadgeProps {
  status: DogStatus;
  size?: 'small' | 'medium' | 'large';
}

export default function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'stray':
        return Colors.warning;
      case 'fostered':
        return Colors.secondary;
      case 'adopted':
        return Colors.success;
      case 'deceased':
        return Colors.textLight;
      default:
        return Colors.primary;
    }
  };

  const getStatusText = () => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4 },
          text: { fontSize: 10 }
        };
      case 'large':
        return {
          container: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
          text: { fontSize: 16 }
        };
      default:
        return {
          container: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
          text: { fontSize: 12 }
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[
      styles.container, 
      { backgroundColor: getStatusColor() },
      sizeStyles.container
    ]}>
      <Text style={[styles.text, sizeStyles.text]}>{getStatusText()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    minWidth: 60,
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontWeight: '600',
  }
});