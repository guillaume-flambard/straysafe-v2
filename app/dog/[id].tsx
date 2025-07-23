import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useDogs } from '@/hooks/dogs-store';
import { useAuth } from '@/hooks/auth-store';
import { DogEvent } from '@/types';
import Colors from '@/constants/colors';
import StatusBadge from '@/components/StatusBadge';
import EventCard from '@/components/EventCard';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export default function DogProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getDog, getDogEvents, addEvent } = useDogs();
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'timeline'>('info');

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
  
  const dog = getDog(id);
  const events = getDogEvents(id);
  
  if (!dog) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Dog not found</Text>
        <Button 
          title="Go Back" 
          onPress={() => router.back()} 
          variant="outline"
        />
      </View>
    );
  }

  const location = locations.find(loc => loc.id === dog.locationId);

  const handleAddEvent = (type: DogEvent['type']) => {
    if (!user) return;
    
    let title = '';
    let description = '';
    
    switch (type) {
      case 'medical':
        title = 'Medical Check';
        description = 'Regular health check performed. Dog appears healthy.';
        break;
      case 'location':
        title = 'Location Update';
        description = 'Dog was spotted at a new location.';
        break;
      case 'status':
        title = 'Status Changed';
        description = 'Status changed to: ' + dog.status;
        break;
      case 'note':
        title = 'General Note';
        description = 'Added a new note about the dog.';
        break;
    }
    
    addEvent({
      dogId: dog.id,
      type,
      title,
      description,
      date: new Date().toISOString(),
      createdBy: user.id,
      isPrivate: false
    });
    
    Alert.alert('Success', 'Event added successfully!');
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: dog.name,
          headerRight: () => (
            hasPermission('volunteer') ? (
              <Pressable 
                style={styles.editButton}
                onPress={() => Alert.alert('Edit', 'Edit functionality would be implemented here')}
              >
                <Ionicons name="pencil" size={20} color={Colors.primary} />
              </Pressable>
            ) : null
          ),
        }} 
      />
      
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Image 
            source={{ uri: dog.mainImage || 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }} 
            style={styles.image} 
          />
          
          <View style={styles.header}>
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{dog.name}</Text>
              <StatusBadge status={dog.status} size="medium" />
            </View>
            
            <Text style={styles.breed}>
              {dog.breed || 'Unknown breed'}{dog.age ? `, ~${dog.age} years` : ''}
            </Text>
            
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color={Colors.textLight} />
              <Text style={styles.location}>
                {location?.name || 'Unknown location'}
              </Text>
            </View>
            
            <View style={styles.tagsContainer}>
              {dog.gender !== 'unknown' && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    {dog.gender.charAt(0).toUpperCase() + dog.gender.slice(1)}
                  </Text>
                </View>
              )}
              {dog.isNeutered && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Neutered</Text>
                </View>
              )}
              {dog.isVaccinated && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Vaccinated</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.tabsContainer}>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'info' && styles.activeTab
              ]}
              onPress={() => setActiveTab('info')}
            >
              <Text 
                style={[
                  styles.tabText,
                  activeTab === 'info' && styles.activeTabText
                ]}
              >
                Information
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                activeTab === 'timeline' && styles.activeTab
              ]}
              onPress={() => setActiveTab('timeline')}
            >
              <Text 
                style={[
                  styles.tabText,
                  activeTab === 'timeline' && styles.activeTabText
                ]}
              >
                Timeline
              </Text>
            </Pressable>
          </View>
          
          {activeTab === 'info' ? (
            <View style={styles.infoContainer}>
              {dog.description && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoTitle}>Description</Text>
                  <Text style={styles.infoText}>{dog.description}</Text>
                </View>
              )}
              
              {dog.status === 'stray' && dog.lastSeen && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoTitle}>Last Seen</Text>
                  <View style={styles.lastSeenContainer}>
                    <Ionicons name="location" size={16} color={Colors.primary} />
                    <Text style={styles.lastSeenText}>
                      {new Date(dog.lastSeen).toLocaleDateString()} at {dog.lastSeenLocation || 'Unknown location'}
                    </Text>
                  </View>
                </View>
              )}
              
              {dog.medicalNotes && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoTitle}>Medical Notes</Text>
                  <Text style={styles.infoText}>{dog.medicalNotes}</Text>
                </View>
              )}
              
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Additional Information</Text>
                <View style={styles.additionalInfoContainer}>
                  <View style={styles.additionalInfoItem}>
                    <Text style={styles.additionalInfoLabel}>Added on</Text>
                    <Text style={styles.additionalInfoValue}>
                      {new Date(dog.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.additionalInfoItem}>
                    <Text style={styles.additionalInfoLabel}>Last updated</Text>
                    <Text style={styles.additionalInfoValue}>
                      {new Date(dog.updatedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.timelineContainer}>
              {hasPermission('volunteer') && (
                <View style={styles.addEventContainer}>
                  <Text style={styles.addEventTitle}>Add New Event</Text>
                  <View style={styles.addEventButtonsContainer}>
                    <Pressable 
                      style={[styles.addEventButton, { backgroundColor: Colors.primary + '20' }]}
                      onPress={() => handleAddEvent('location')}
                    >
                      <Ionicons name="location" size={20} color={Colors.primary} />
                      <Text style={[styles.addEventButtonText, { color: Colors.primary }]}>Location</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.addEventButton, { backgroundColor: Colors.danger + '20' }]}
                      onPress={() => handleAddEvent('medical')}
                    >
                      <Ionicons name="medical" size={20} color={Colors.danger} />
                      <Text style={[styles.addEventButtonText, { color: Colors.danger }]}>Medical</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.addEventButton, { backgroundColor: Colors.secondary + '20' }]}
                      onPress={() => handleAddEvent('status')}
                    >
                      <Ionicons name="calendar" size={20} color={Colors.secondary} />
                      <Text style={[styles.addEventButtonText, { color: Colors.secondary }]}>Status</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.addEventButton, { backgroundColor: Colors.textLight + '20' }]}
                      onPress={() => handleAddEvent('note')}
                    >
                      <Ionicons name="document-text" size={20} color={Colors.textLight} />
                      <Text style={[styles.addEventButtonText, { color: Colors.textLight }]}>Note</Text>
                    </Pressable>
                  </View>
                </View>
              )}
              
              {events.length === 0 ? (
                <View style={styles.emptyTimelineContainer}>
                  <Text style={styles.emptyTimelineText}>No events yet</Text>
                  {hasPermission('volunteer') && (
                    <Button
                      title="Add First Event"
                      onPress={() => handleAddEvent('note')}
                      leftIcon={<Ionicons name="add" size={16} color="white" />}
                      style={styles.addFirstEventButton}
                    />
                  )}
                </View>
              ) : (
                <View>
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  editButton: {
    padding: 8,
  },
  image: {
    width: '100%',
    height: 250,
  },
  header: {
    padding: 16,
    backgroundColor: Colors.card,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  breed: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: Colors.border,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: Colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginTop: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textLight,
  },
  activeTabText: {
    color: Colors.primary,
  },
  infoContainer: {
    padding: 16,
  },
  infoSection: {
    marginBottom: 20,
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
    lineHeight: 20,
  },
  lastSeenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastSeenText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 6,
  },
  additionalInfoContainer: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
  },
  additionalInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  additionalInfoLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  additionalInfoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  timelineContainer: {
    padding: 16,
  },
  addEventContainer: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  addEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  addEventButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  addEventButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  addEventButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyTimelineContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyTimelineText: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 16,
  },
  addFirstEventButton: {
    paddingHorizontal: 20,
  },
});