import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Colors from '@/constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    
    const result = await signIn(email, password);
    
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Login Failed', result.error || 'Please check your credentials and try again.');
    }
  };

  const handleDemoLogin = async () => {
    // Demo credentials for testing
    const demoEmail = 'admin@straysafe.org';
    const demoPassword = 'password';
    
    setEmail(demoEmail);
    setPassword(demoPassword);
    
    const result = await signIn(demoEmail, demoPassword);
    
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Demo Login Failed', result.error || 'Please try again later.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }}
            style={styles.logo}
          />
          <Text style={styles.title}>StraySafe</Text>
          <Text style={styles.subtitle}>Protecting stray dogs together</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Input
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
          />
          
          <Input
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />
          
          <Button
            title="Log In"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
            fullWidth
          />
          
          <Button
            title="Demo Login"
            onPress={handleDemoLogin}
            variant="outline"
            style={styles.demoButton}
            fullWidth
          />
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            For demo purposes, use:
          </Text>
          <Text style={styles.credentials}>
            Email: admin@straysafe.org
          </Text>
          <Text style={styles.credentials}>
            Password: password
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    marginTop: 10,
  },
  demoButton: {
    marginTop: 12,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  credentials: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
});