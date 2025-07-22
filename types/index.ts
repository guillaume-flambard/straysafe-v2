export type DogStatus = 'stray' | 'fostered' | 'adopted' | 'deceased';

export type DogGender = 'male' | 'female' | 'unknown';

export type UserRole = 'admin' | 'volunteer' | 'vet' | 'viewer';

export interface Location {
  id: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  locationId: string;
  avatar?: string;
  createdAt: string;
}

export interface Dog {
  id: string;
  name: string;
  status: DogStatus;
  gender: DogGender;
  locationId: string;
  breed?: string;
  age?: number;
  description?: string;
  lastSeen?: string;
  lastSeenLocation?: string;
  medicalNotes?: string;
  isNeutered: boolean;
  isVaccinated: boolean;
  mainImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DogEvent {
  id: string;
  dogId: string;
  type: 'medical' | 'location' | 'status' | 'note';
  title: string;
  description: string;
  date: string;
  createdBy: string;
  isPrivate: boolean;
}