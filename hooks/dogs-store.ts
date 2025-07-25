import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dog, DogEvent, DogStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-store';
import { sendDogDiscussionUpdate } from '@/utils/notifications';

export const [DogsContext, useDogs] = createContextHook(() => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [events, setEvents] = useState<DogEvent[]>([]);

  // TEMPORARY: Return mock data to test app stability
  const dogsQuery = useQuery({
    queryKey: ['dogs'],
    queryFn: async () => {
      console.log('Loading mock dogs data...');
      // Return sample data instead of querying Supabase
      return [
        {
          id: '1',
          name: 'Sample Dog',
          status: 'stray' as DogStatus,
          gender: 'unknown' as 'male' | 'female' | 'unknown',
          locationId: '1',
          breed: 'Mixed',
          age: 2,
          description: 'A friendly dog',
          lastSeen: null,
          lastSeenLocation: null,
          medicalNotes: null,
          isNeutered: false,
          isVaccinated: false,
          mainImage: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: null,
        }
      ];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // TEMPORARY: Return mock events data
  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      console.log('Loading mock events data...');
      return [
        {
          id: '1',
          dogId: '1',
          type: 'note' as 'medical' | 'location' | 'status' | 'note',
          title: 'Dog found',
          description: 'Sample event for testing',
          date: new Date().toISOString(),
          createdBy: '1',
          isPrivate: false,
          createdAt: new Date().toISOString(),
        }
      ];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Update local state when queries complete
  useEffect(() => {
    if (dogsQuery.data) {
      setDogs(dogsQuery.data);
    }
  }, [dogsQuery.data]);

  useEffect(() => {
    if (eventsQuery.data) {
      setEvents(eventsQuery.data);
    }
  }, [eventsQuery.data]);

  // Mutation to create a new dog
  const createDogMutation = useMutation({
    mutationFn: async (newDog: Omit<Dog, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase
        .from('dogs')
        .insert({
          name: newDog.name,
          status: newDog.status,
          gender: newDog.gender,
          location_id: newDog.locationId,
          breed: newDog.breed,
          age: newDog.age,
          description: newDog.description,
          last_seen: newDog.lastSeen,
          last_seen_location: newDog.lastSeenLocation,
          medical_notes: newDog.medicalNotes,
          is_neutered: newDog.isNeutered,
          is_vaccinated: newDog.isVaccinated,
          main_image: newDog.mainImage,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
    }
  });

  // Mutation to update a dog
  const updateDogMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Dog> }) => {
      const { data, error } = await supabase
        .from('dogs')
        .update({
          name: updates.name,
          status: updates.status,
          gender: updates.gender,
          location_id: updates.locationId,
          breed: updates.breed,
          age: updates.age,
          description: updates.description,
          last_seen: updates.lastSeen,
          last_seen_location: updates.lastSeenLocation,
          medical_notes: updates.medicalNotes,
          is_neutered: updates.isNeutered,
          is_vaccinated: updates.isVaccinated,
          main_image: updates.mainImage,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dogs'] });
    }
  });

  // Mutation to create a new event
  const createEventMutation = useMutation({
    mutationFn: async (newEvent: Omit<DogEvent, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase
        .from('events')
        .insert({
          dog_id: newEvent.dogId,
          type: newEvent.type,
          title: newEvent.title,
          description: newEvent.description,
          date: newEvent.date,
          created_by: user?.id || '',
          is_private: newEvent.isPrivate,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  // Add a new dog
  const addDog = async (dog: Omit<Dog, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dog> => {
    return new Promise((resolve, reject) => {
      createDogMutation.mutate(dog, {
        onSuccess: (data) => {
          resolve(data);
        },
        onError: (error) => {
          reject(error);
        }
      });
    });
  };

  // Update an existing dog
  const updateDog = (id: string, updates: Partial<Dog>) => {
    updateDogMutation.mutate({ id, updates });
  };

  // Add a new event
  const addEvent = async (event: Omit<DogEvent, 'id' | 'createdAt'>) => {
    if (!user) return null;
    
    createEventMutation.mutate(event);
    
    // If it's a status event, update the dog's status
    if (event.type === 'status' && event.title.toLowerCase().includes('status changed')) {
      const statusMatch = event.description.match(/Status changed to: (stray|fostered|adopted|deceased)/i);
      if (statusMatch && statusMatch[1]) {
        const newStatus = statusMatch[1].toLowerCase() as DogStatus;
        updateDog(event.dogId, { status: newStatus });
        
        // Send notification for status change
        const dog = getDog(event.dogId);
        if (dog) {
          try {
            // Get all users who might be interested in this dog
            const { data: interestedUsers } = await supabase
              .from('profiles')
              .select('id')
              .neq('id', user.id);
            
            if (interestedUsers && interestedUsers.length > 0) {
              await sendDogDiscussionUpdate({
                conversationId: '', // We'll need to create or find dog discussion
                dogId: dog.id,
                dogName: dog.name,
                updateType: 'status_change',
                recipientUserIds: interestedUsers.map(u => u.id),
              });
            }
          } catch (error) {
            console.error('Error sending dog status notification:', error);
          }
        }
      }
    }
  };

  // Get events for a specific dog
  const getDogEvents = (dogId: string) => {
    return events.filter(event => event.dogId === dogId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Get a specific dog by ID
  const getDog = (id: string) => {
    return dogs.find(dog => dog.id === id) || null;
  };

  // Filter dogs by status
  const filterDogsByStatus = (status: DogStatus | 'all') => {
    if (status === 'all') return dogs;
    return dogs.filter(dog => dog.status === status);
  };

  return {
    dogs,
    events,
    isLoading: (dogsQuery.isLoading || eventsQuery.isLoading) && !dogsQuery.error && !eventsQuery.error,
    addDog,
    updateDog,
    addEvent,
    getDogEvents,
    getDog,
    filterDogsByStatus
  };
});