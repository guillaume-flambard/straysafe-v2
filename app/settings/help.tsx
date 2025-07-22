import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Linking, Alert } from 'react-native';
import Colors from '@/constants/colors';
import { MessageCircle, Mail, Phone, FileText, ExternalLink } from 'lucide-react-native';

export default function HelpScreen() {
  const handleContactPress = (type: string, value: string) => {
    switch (type) {
      case 'email':
        Linking.openURL(`mailto:${value}`);
        break;
      case 'phone':
        Linking.openURL(`tel:${value}`);
        break;
      case 'website':
        Linking.openURL(value);
        break;
      default:
        Alert.alert('Coming Soon', 'This feature will be available soon.');
    }
  };

  const HelpOption = ({ 
    icon, 
    title, 
    description, 
    onPress,
    color = Colors.primary 
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    onPress: () => void;
    color?: string;
  }) => (
    <Pressable
      style={({ pressed }) => [
        styles.helpOption,
        pressed && styles.helpOptionPressed
      ]}
      onPress={onPress}
    >
      <View style={[styles.helpIconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <View style={styles.helpTextContainer}>
        <Text style={styles.helpTitle}>{title}</Text>
        <Text style={styles.helpDescription}>{description}</Text>
      </View>
      <ExternalLink size={16} color={Colors.textLight} />
    </Pressable>
  );

  const FAQItem = ({ question, answer }: { question: string; answer: string }) => (
    <View style={styles.faqItem}>
      <Text style={styles.faqQuestion}>{question}</Text>
      <Text style={styles.faqAnswer}>{answer}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Get Help</Text>
        
        <HelpOption
          icon={<MessageCircle size={20} color={Colors.primary} />}
          title="Live Chat"
          description="Chat with our support team"
          onPress={() => Alert.alert('Coming Soon', 'Live chat will be available soon.')}
        />
        
        <HelpOption
          icon={<Mail size={20} color={Colors.secondary} />}
          title="Email Support"
          description="Send us an email for detailed help"
          onPress={() => handleContactPress('email', 'support@straysafe.org')}
          color={Colors.secondary}
        />
        
        <HelpOption
          icon={<Phone size={20} color={Colors.success} />}
          title="Emergency Hotline"
          description="Call for urgent animal welfare issues"
          onPress={() => handleContactPress('phone', '+66-123-456-789')}
          color={Colors.success}
        />
        
        <HelpOption
          icon={<FileText size={20} color={Colors.warning} />}
          title="User Guide"
          description="Learn how to use all app features"
          onPress={() => handleContactPress('website', 'https://straysafe.org/guide')}
          color={Colors.warning}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        <FAQItem
          question="How do I report a stray dog?"
          answer="Use the 'Add Dog' tab to create a new profile for any stray dog you encounter. Include as much detail as possible including location and photos."
        />
        
        <FAQItem
          question="Can I foster a dog through this app?"
          answer="Yes! Contact the dog's current caretaker or our support team to discuss fostering opportunities."
        />
        
        <FAQItem
          question="How do I update a dog's status?"
          answer="Only volunteers and admins can update dog statuses. If you're not a volunteer, please contact us with updates."
        />
        
        <FAQItem
          question="Is my personal information safe?"
          answer="Yes, we take privacy seriously. Your data is encrypted and we never share personal information without consent."
        />
      </View>

      <View style={styles.contactSection}>
        <Text style={styles.contactTitle}>Emergency Contacts</Text>
        <Text style={styles.contactText}>
          For immediate animal welfare emergencies, please contact local authorities or animal rescue services.
        </Text>
        <Text style={styles.contactNumber}>Emergency: 191</Text>
        <Text style={styles.contactNumber}>Animal Rescue: +66-123-456-789</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  helpOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  helpOptionPressed: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  helpIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 2,
  },
  helpDescription: {
    fontSize: 12,
    color: Colors.textLight,
  },
  faqItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: Colors.danger + '10',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.danger + '30',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.danger,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  contactNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.danger,
    marginBottom: 4,
  },
});