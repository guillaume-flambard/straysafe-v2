import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
  Pressable,
  Animated,
  SafeAreaView,
} from 'react-native';
// LinearGradient removed due to React 19 compatibility issues
import {
  Heart,
  MessageCircle,
  MapPin,
  Users,
  Shield,
  Bell,
  Camera,
  Search,
  ArrowRight,
  Check,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to StraySafe',
    subtitle: 'Helping stray animals together',
    description: 'Join our community of volunteers, veterinarians, and animal lovers working together to help stray dogs find safety and care.',
    icon: <Heart size={60} color="white" />,
    gradient: [Colors.primary, Colors.secondary],
  },
  {
    id: 'tracking',
    title: 'Track & Monitor',
    subtitle: 'Keep detailed records',
    description: 'Document stray dogs with photos, location data, medical notes, and status updates. Every detail helps in their rescue journey.',
    icon: <Camera size={60} color="white" />,
    gradient: [Colors.success, Colors.primary],
  },
  {
    id: 'collaboration',
    title: 'Real-time Collaboration',
    subtitle: 'Work together effectively',
    description: 'Chat with team members, share updates instantly, and coordinate rescue efforts through our messaging system.',
    icon: <MessageCircle size={60} color="white" />,
    gradient: [Colors.secondary, Colors.warning],
  },
  {
    id: 'location',
    title: 'Location-Based',
    subtitle: 'Find dogs near you',
    description: 'Use GPS to track exact locations, mark last seen spots, and coordinate based on your area of operation.',
    icon: <MapPin size={60} color="white" />,
    gradient: [Colors.warning, Colors.danger],
  },
  {
    id: 'community',
    title: 'Community Driven',
    subtitle: 'Connect with others',
    description: 'Join a network of volunteers, vets, and administrators. Share knowledge and work together for better outcomes.',
    icon: <Users size={60} color="white" />,
    gradient: [Colors.danger, Colors.success],
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    subtitle: 'Your data is protected',
    description: 'We respect your privacy. Control what you share, who can see your profile, and manage your data with granular settings.',
    icon: <Shield size={60} color="white" />,
    gradient: [Colors.textLight, Colors.primary],
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      const nextIndex = currentStep + 1;
      setCurrentStep(nextIndex);
      
      // Animate scroll to next step
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      // Complete onboarding
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      const prevIndex = currentStep - 1;
      setCurrentStep(prevIndex);
      
      scrollViewRef.current?.scrollTo({
        x: prevIndex * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const skipToEnd = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onComplete();
    });
  };

  const goToStep = (index: number) => {
    setCurrentStep(index);
    scrollViewRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
  };

  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Skip Button */}
        <View style={styles.header}>
          <Pressable onPress={skipToEnd} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Content Carousel */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.carousel}
        >
          {onboardingSteps.map((step, index) => (
            <View key={step.id} style={styles.stepContainer}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: step.gradient[0] } // Use first gradient color
                ]}
              >
                {step.icon}
              </View>

              <View style={styles.contentContainer}>
                <Text style={styles.title}>{step.title}</Text>
                <Text style={styles.subtitle}>{step.subtitle}</Text>
                <Text style={styles.description}>{step.description}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Page Indicators */}
        <View style={styles.indicatorContainer}>
          {onboardingSteps.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => goToStep(index)}
              style={[
                styles.indicator,
                currentStep === index && styles.activeIndicator,
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <Button
              title="Previous"
              onPress={previousStep}
              variant="outline"
              style={styles.previousButton}
            />
          )}

          <Button
            title={isLastStep ? "Get Started" : "Next"}
            onPress={nextStep}
            leftIcon={
              isLastStep ? (
                <Check size={18} color="white" />
              ) : (
                <ArrowRight size={18} color="white" />
              )
            }
            style={[
              styles.nextButton,
              currentStep === 0 && styles.nextButtonFullWidth,
            ]}
          />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentStep + 1) / onboardingSteps.length) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {onboardingSteps.length}
          </Text>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '500',
  },
  carousel: {
    flex: 1,
  },
  stepContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  contentContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 12,
  },
  previousButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  nextButtonFullWidth: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textLight,
  },
});