import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DogEvent } from '@/types';
import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface EventCardProps {
  event: DogEvent;
}

export default function EventCard({ event }: EventCardProps) {
  const getEventIcon = () => {
    switch (event.type) {
      case 'medical':
        return <Ionicons name="medical" size={20} color={Colors.danger} />;
      case 'location':
        return <Ionicons name="location" size={20} color={Colors.primary} />;
      case 'status':
        return <Ionicons name="calendar" size={20} color={Colors.secondary} />;
      case 'note':
      default:
        return <Ionicons name="document-text" size={20} color={Colors.textLight} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {getEventIcon()}
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.date}>{formatDate(event.date)}</Text>
        <Text style={styles.description}>{event.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: Colors.text,
  },
});