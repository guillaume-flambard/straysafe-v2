import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/auth-store';
import { MapPin, Check } from 'lucide-react-native';

export default function LocationSettingsScreen() {
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState(user?.locationId || '');

  // Fetch locations from database
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const LocationOption = ({ location }: { location: typeof locations[0] }) => {
    const isSelected = selectedLocation === location.id;
    
    return (
      <Pressable
        style={[
          styles.locationOption,
          isSelected && styles.locationOptionSelected
        ]}
        onPress={() => setSelectedLocation(location.id)}
      >
        <View style={styles.locationInfo}>
          <View style={[
            styles.locationIconContainer,
            { backgroundColor: isSelected ? Colors.primary + '20' : Colors.background }
          ]}>
            <MapPin size={20} color={isSelected ? Colors.primary : Colors.textLight} />
          </View>
          <View style={styles.locationText}>
            <Text style={[
              styles.locationName,
              isSelected && styles.locationNameSelected
            ]}>
              {location.name}
            </Text>
            {location.description && (
              <Text style={styles.locationDescription}>
                {location.description}
              </Text>
            )}
          </View>
        </View>
        {isSelected && (
          <Check size={20} color={Colors.primary} />
        )}
      </Pressable>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Your Location</Text>
        <Text style={styles.headerDescription}>
          Choose the location where you'll be working with stray dogs. This helps us show you relevant information.
        </Text>
      </View>

      <View style={styles.locationsContainer}>
        {locations.map((location) => (
          <LocationOption key={location.id} location={location} />
        ))}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Why do we need your location?</Text>
        <Text style={styles.infoText}>
          Your location helps us:
        </Text>
        <View style={styles.benefitsList}>
          <Text style={styles.benefitItem}>• Show dogs in your area</Text>
          <Text style={styles.benefitItem}>• Connect you with local volunteers</Text>
          <Text style={styles.benefitItem}>• Provide relevant resources and contacts</Text>
          <Text style={styles.benefitItem}>• Send location-specific notifications</Text>
        </View>
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
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  locationsContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  locationOptionSelected: {
    backgroundColor: Colors.primary + '10',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationText: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  locationNameSelected: {
    color: Colors.primary,
  },
  locationDescription: {
    fontSize: 12,
    color: Colors.textLight,
  },
  infoSection: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  benefitsList: {
    marginTop: 8,
  },
  benefitItem: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 6,
    lineHeight: 20,
  },
});