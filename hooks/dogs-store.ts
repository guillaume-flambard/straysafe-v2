import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dog, DogEvent, DogStatus } from '@/types';
import { mockDogs, mockEvents } from '@/mocks/data';
import { useAuth } from './auth-store';

export const [DogsContext, useDogs] = createContextHook(() => {
  const { user } = useAuth();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [events, setEvents] = useState<DogEvent[]>([]);

  // Fetch dogs from storage or mock data
  const dogsQuery = useQuery({
    queryKey: ['dogs'],
    queryFn: async () => {
      try {
        const storedDogs = await AsyncStorage.getItem('dogs');
        if (storedDogs) {
          return JSON.parse(storedDogs) as Dog[];
        }
        // Initialize with mock data
        await AsyncStorage.setItem('dogs', JSON.stringify(mockDogs));
        return mockDogs;
      } catch (error) {
        console.error('Failed to load dogs:', error);
        return mockDogs;
      }
    },
    enabled: !!user
  });

  // Fetch events from storage or mock data
  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      try {
        const storedEvents = await AsyncStorage.getItem('events');
        if (storedEvents) {
          return JSON.parse(storedEvents) as DogEvent[];
        }
        // Initialize with mock data
        await AsyncStorage.setItem('events', JSON.stringify(mockEvents));
        return mockEvents;
      } catch (error) {
        console.error('Failed to load events:', error);
        return mockEvents;
      }
    },
    enabled: !!user
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

  // Mutation to update dogs
  const updateDogsMutation = useMutation({
    mutationFn: async (updatedDogs: Dog[]) => {
      await AsyncStorage.setItem('dogs', JSON.stringify(updatedDogs));
      return updatedDogs;
    },
    onSuccess: (data) => {
      setDogs(data);
    }
  });

  // Mutation to update events
  const updateEventsMutation = useMutation({
    mutationFn: async (updatedEvents: DogEvent[]) => {
      await AsyncStorage.setItem('events', JSON.stringify(updatedEvents));
      return updatedEvents;
    },
    onSuccess: (data) => {
      setEvents(data);
    }
  });

  // Add a new dog
  const addDog = (dog: Omit<Dog, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDog: Dog = {
      ...dog,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedDogs = [...dogs, newDog];
    updateDogsMutation.mutate(updatedDogs);
    return newDog;
  };

  // Update an existing dog
  const updateDog = (id: string, updates: Partial<Dog>) => {
    const updatedDogs = dogs.map(dog => 
      dog.id === id 
        ? { ...dog, ...updates, updatedAt: new Date().toISOString() } 
        : dog
    );
    updateDogsMutation.mutate(updatedDogs);
  };

  // Add a new event
  const addEvent = (event: Omit<DogEvent, 'id'>) => {
    if (!user) return null;
    
    const newEvent: DogEvent = {
      ...event,
      id: Date.now().toString(),
      createdBy: user.id
    };
    
    const updatedEvents = [...events, newEvent];
    updateEventsMutation.mutate(updatedEvents);
    
    // If it's a status event, update the dog's status
    if (event.type === 'status' && event.title.toLowerCase().includes('status changed')) {
      const statusMatch = event.description.match(/Status changed to: (stray|fostered|adopted|deceased)/i);
      if (statusMatch && statusMatch[1]) {
        const newStatus = statusMatch[1].toLowerCase() as DogStatus;
        updateDog(event.dogId, { status: newStatus });
      }
    }
    
    return newEvent;
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
    isLoading: dogsQuery.isLoading || eventsQuery.isLoading,
    addDog,
    updateDog,
    addEvent,
    getDogEvents,
    getDog,
    filterDogsByStatus
  };
});