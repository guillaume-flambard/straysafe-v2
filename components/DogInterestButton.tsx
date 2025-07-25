import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InterestType } from '@/types';
import Colors from '@/constants/colors';
import Button from './Button';

interface DogInterestButtonProps {
  type: InterestType;
  onExpressInterest: (type: InterestType, message?: string) => Promise<boolean>;
  disabled: boolean;
  hasExistingInterest: boolean;
  loading: boolean;
}

const interestConfig = {
  adoption: {
    icon: 'heart' as const,
    label: 'Adopt',
    color: Colors.danger,
    description: 'Express interest in adopting this dog',
    placeholder: 'Tell us why you want to adopt this dog...',
  },
  fostering: {
    icon: 'home' as const,
    label: 'Foster',
    color: Colors.secondary,
    description: 'Express interest in fostering this dog',
    placeholder: 'Tell us about your fostering experience...',
  },
  sponsoring: {
    icon: 'gift' as const,
    label: 'Sponsor',
    color: Colors.primary,
    description: 'Express interest in sponsoring this dog',
    placeholder: 'Tell us how you would like to help...',
  },
  volunteering: {
    icon: 'hand-left' as const,
    label: 'Volunteer',
    color: Colors.success,
    description: 'Express interest in volunteering for this dog',
    placeholder: 'Tell us how you can help...',
  },
};

export default function DogInterestButton({ 
  type, 
  onExpressInterest, 
  disabled, 
  hasExistingInterest,
  loading 
}: DogInterestButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const config = interestConfig[type];

  const handlePress = () => {
    if (hasExistingInterest) {
      Alert.alert(
        'Interest Already Expressed',
        `You have already expressed interest in ${type} for this dog.`,
        [{ text: 'OK' }]
      );
      return;
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const success = await onExpressInterest(type, message.trim() || undefined);
    setSubmitting(false);
    
    if (success) {
      setModalVisible(false);
      setMessage('');
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    setMessage('');
  };

  return (
    <>
      <Button
        title={config.label}
        onPress={handlePress}
        disabled={disabled || loading}
        leftIcon={
          <Ionicons 
            name={config.icon} 
            size={16} 
            color={hasExistingInterest ? Colors.success : 'white'} 
          />
        }
        style={[
          styles.button,
          { backgroundColor: hasExistingInterest ? Colors.success : config.color },
        ]}
        variant={hasExistingInterest ? 'outline' : 'primary'}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable
              onPress={handleCancel}
              style={styles.headerButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Express Interest</Text>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={[styles.headerButton, submitting && styles.headerButtonDisabled]}
            >
              <Text style={[styles.submitText, submitting && styles.submitTextDisabled]}>
                {submitting ? 'Sending...' : 'Submit'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.interestHeader}>
              <Ionicons name={config.icon} size={24} color={config.color} />
              <Text style={styles.interestTitle}>{config.label}</Text>
            </View>
            
            <Text style={styles.interestDescription}>
              {config.description}
            </Text>

            <Text style={styles.inputLabel}>
              Message (Optional)
            </Text>
            <TextInput
              style={styles.messageInput}
              multiline
              numberOfLines={4}
              placeholder={config.placeholder}
              placeholderTextColor={Colors.textLight}
              value={message}
              onChangeText={setMessage}
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {message.length}/500
            </Text>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={16} color={Colors.primary} />
              <Text style={styles.infoText}>
                Your interest will be reviewed by our volunteers. We'll contact you via the app or email if you're selected.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    minWidth: 60,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  submitText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'right',
  },
  submitTextDisabled: {
    color: Colors.textLight,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  interestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  interestTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  interestDescription: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.card,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});