import React, { useState, useEffect } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  opacity: Animated.Value;
}

class ToastManager {
  private static instance: ToastManager;
  private toastRef: ToastComponent | null = null;

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  setToastRef(ref: ToastComponent | null) {
    this.toastRef = ref;
  }

  show(message: string, type: ToastType = 'info') {
    if (this.toastRef) {
      this.toastRef.show(message, type);
    }
  }
}

interface ToastComponentProps {}

export class ToastComponent extends React.Component<ToastComponentProps, ToastState> {
  constructor(props: ToastComponentProps) {
    super(props);
    this.state = {
      visible: false,
      message: '',
      type: 'info',
      opacity: new Animated.Value(0),
    };
  }

  componentDidMount() {
    ToastManager.getInstance().setToastRef(this);
  }

  componentWillUnmount() {
    ToastManager.getInstance().setToastRef(null);
  }

  show = (message: string, type: ToastType) => {
    this.setState({
      message,
      type,
      visible: true,
    });

    Animated.sequence([
      Animated.timing(this.state.opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(this.state.opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      this.setState({ visible: false });
    });
  };

  render() {
    const { visible, message, type, opacity } = this.state;

    if (!visible) {
      return null;
    }

    return (
      <Animated.View
        style={[
          styles.toast,
          type === 'success' && styles.toastSuccess,
          type === 'error' && styles.toastError,
          type === 'warning' && styles.toastWarning,
          type === 'info' && styles.toastInfo,
          { opacity },
        ]}
      >
        <Text style={styles.toastText}>{message}</Text>
      </Animated.View>
    );
  }
}

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

export const showToast = (message: string, type: ToastType = 'info') => {
  ToastManager.getInstance().show(message, type);
};

export default ToastComponent;