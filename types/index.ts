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
  locationId?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
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
  createdBy?: string;
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
  createdAt: string;
}

export type InterestType = 'adoption' | 'fostering' | 'sponsoring' | 'volunteering';

export interface DogInterest {
  id: string;
  dogId: string;
  userId: string;
  type: InterestType;
  message?: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  createdAt: string;
  updatedAt: string;
}

export interface DogComment {
  id: string;
  dogId: string;
  userId: string;
  content: string;
  parentId?: string; // For replies
  isModerated: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DogFollowing {
  id: string;
  dogId: string;
  userId: string;
  notificationsEnabled: boolean;
  createdAt: string;
}

export interface DogCommentWithUser extends DogComment {
  user: {
    id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  replies?: DogCommentWithUser[];
}

export interface Conversation {
  id: string;
  participants: string[]; // Array of user IDs
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'dog_reference';
  dogId?: string; // For dog reference messages
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageWithUser extends Message {
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
}

export interface ConversationWithDetails extends Conversation {
  otherParticipant: {
    id: string;
    name: string;
    avatar?: string;
    role: UserRole;
  };
  unreadCount: number;
}