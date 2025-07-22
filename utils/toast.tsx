import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Simple toast implementation that's React 19 compatible
export const showToast = (message: string, type: ToastType = 'info') => {
  // Simple console output for development
  console.log(`🍞 Toast [${type.toUpperCase()}]: ${message}`);
};

// Simple non-animated toast component
export const ToastComponent: React.FC = () => {
  // Return null to avoid React 19 issues
  return null;
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  toastSuccess: {
    backgroundColor: Colors.success,
  },
  toastError: {
    backgroundColor: Colors.danger,
  },
  toastWarning: {
    backgroundColor: Colors.warning,
  },
  toastInfo: {
    backgroundColor: Colors.primary,
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ToastComponent;