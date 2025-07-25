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

  const dogsQuery = useQuery({
    queryKey: ['dogs'],
    queryFn: async () => {
      console.log('Loading dogs from Supabase...');
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading dogs:', error);
        throw error;
      }

      // Transform snake_case to camelCase
      return (data || []).map(dog => ({
        id: dog.id,
        name: dog.name,
        status: dog.status as DogStatus,
        gender: dog.gender as 'male' | 'female' | 'unknown',
        locationId: dog.location_id,
        breed: dog.breed,
        age: dog.age,
        description: dog.description,
        lastSeen: dog.last_seen,
        lastSeenLocation: dog.last_seen_location,
        medicalNotes: dog.medical_notes,
        isNeutered: dog.is_neutered,
        isVaccinated: dog.is_vaccinated,
        mainImage: dog.main_image,
        createdAt: dog.created_at,
        updatedAt: dog.updated_at,
        createdBy: dog.created_by,
      }));
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      console.log('Loading events from Supabase...');
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading events:', error);
        throw error;
      }

      // Transform snake_case to camelCase
      return (data || []).map(event => ({
        id: event.id,
        dogId: event.dog_id,
        type: event.type as 'medical' | 'location' | 'status' | 'note',
        title: event.title,
        description: event.description,
        date: event.date,
        createdBy: event.created_by,
        isPrivate: event.is_private,
        createdAt: event.created_at,
      }));
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