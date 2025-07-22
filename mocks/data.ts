import { Dog, DogEvent, Location, User } from '@/types';

export const mockLocations: Location[] = [
  {
    id: '1',
    name: 'Koh Phangan',
    description: 'Island in the Gulf of Thailand'
  },
  {
    id: '2',
    name: 'Chiang Mai',
    description: 'Northern Thailand'
  },
  {
    id: '3',
    name: 'Bangkok',
    description: 'Capital city of Thailand'
  }
];

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@straysafe.org',
    name: 'Admin User',
    role: 'admin',
    locationId: '1',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    createdAt: '2025-06-01T00:00:00.000Z'
  },
  {
    id: '2',
    email: 'volunteer@straysafe.org',
    name: 'Volunteer User',
    role: 'volunteer',
    locationId: '1',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    createdAt: '2025-06-02T00:00:00.000Z'
  },
  {
    id: '3',
    email: 'vet@straysafe.org',
    name: 'Vet User',
    role: 'vet',
    locationId: '1',
    createdAt: '2025-06-03T00:00:00.000Z'
  }
];

export const mockDogs: Dog[] = [
  {
    id: '1',
    name: 'Max',
    status: 'stray',
    gender: 'male',
    locationId: '1',
    breed: 'Mixed',
    age: 3,
    description: 'Friendly dog often seen near the beach. Responds to food and gentle approach.',
    lastSeen: '2025-07-20T14:30:00.000Z',
    lastSeenLocation: 'Thong Sala Market',
    medicalNotes: 'Appears healthy but has a slight limp in right hind leg.',
    isNeutered: false,
    isVaccinated: false,
    mainImage: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    createdAt: '2025-06-15T00:00:00.000Z',
    updatedAt: '2025-07-20T14:30:00.000Z'
  },
  {
    id: '2',
    name: 'Luna',
    status: 'fostered',
    gender: 'female',
    locationId: '1',
    breed: 'Thai Ridgeback Mix',
    age: 2,
    description: 'Sweet and gentle. Good with other dogs and children.',
    medicalNotes: 'Recovered from minor skin infection. On regular flea treatment.',
    isNeutered: true,
    isVaccinated: true,
    mainImage: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    createdAt: '2025-05-10T00:00:00.000Z',
    updatedAt: '2025-07-15T10:20:00.000Z'
  },
  {
    id: '3',
    name: 'Rocky',
    status: 'stray',
    gender: 'male',
    locationId: '1',
    breed: 'Unknown',
    age: 5,
    description: 'Cautious but not aggressive. Has distinctive white patch on chest.',
    lastSeen: '2025-07-21T09:15:00.000Z',
    lastSeenLocation: 'Near 7-Eleven in Baan Tai',
    isNeutered: false,
    isVaccinated: false,
    mainImage: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    createdAt: '2025-07-01T00:00:00.000Z',
    updatedAt: '2025-07-21T09:15:00.000Z'
  },
  {
    id: '4',
    name: 'Bella',
    status: 'adopted',
    gender: 'female',
    locationId: '1',
    breed: 'Thai Mix',
    age: 1,
    description: 'Playful and energetic. Loves to chase balls.',
    medicalNotes: 'Fully vaccinated and in excellent health.',
    isNeutered: true,
    isVaccinated: true,
    mainImage: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    createdAt: '2025-04-20T00:00:00.000Z',
    updatedAt: '2025-06-30T16:45:00.000Z'
  },
  {
    id: '5',
    name: 'Charlie',
    status: 'stray',
    gender: 'male',
    locationId: '1',
    breed: 'Unknown',
    description: 'Shy dog, runs away when approached directly.',
    lastSeen: '2025-07-19T17:20:00.000Z',
    lastSeenLocation: 'Srithanu area',
    isNeutered: false,
    isVaccinated: false,
    mainImage: 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    createdAt: '2025-07-10T00:00:00.000Z',
    updatedAt: '2025-07-19T17:20:00.000Z'
  }
];

export const mockEvents: DogEvent[] = [
  {
    id: '1',
    dogId: '1',
    type: 'location',
    title: 'Spotted at Thong Sala Market',
    description: 'Seen scavenging for food near the food stalls.',
    date: '2025-07-20T14:30:00.000Z',
    createdBy: '2',
    isPrivate: false
  },
  {
    id: '2',
    dogId: '1',
    type: 'medical',
    title: 'Observed limping',
    description: 'Dog has a noticeable limp in right hind leg. Does not appear to be in severe pain.',
    date: '2025-07-20T14:35:00.000Z',
    createdBy: '2',
    isPrivate: false
  },
  {
    id: '3',
    dogId: '2',
    type: 'status',
    title: 'Moved to foster home',
    description: 'Luna has been placed in a foster home with Jane Smith.',
    date: '2025-06-15T09:00:00.000Z',
    createdBy: '1',
    isPrivate: false
  },
  {
    id: '4',
    dogId: '2',
    type: 'medical',
    title: 'Vaccination completed',
    description: 'Received core vaccines including rabies, distemper, and parvovirus.',
    date: '2025-06-20T11:30:00.000Z',
    createdBy: '3',
    isPrivate: false
  },
  {
    id: '5',
    dogId: '2',
    type: 'medical',
    title: 'Spaying procedure',
    description: 'Successfully spayed. Recovery normal with no complications.',
    date: '2025-07-05T10:00:00.000Z',
    createdBy: '3',
    isPrivate: false
  }
];