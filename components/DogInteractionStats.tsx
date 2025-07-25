import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/colors';

interface DogInteractionStatsProps {
  dogId: string;
  size?: 'small' | 'medium';
}

interface Stats {
  adoptionInterests: number;
  fosteringInterests: number;
  totalInterests: number;
  commentCount: number;
  followerCount: number;
}

export default function DogInteractionStats({ dogId, size = 'small' }: DogInteractionStatsProps) {
  const [stats, setStats] = useState<Stats>({
    adoptionInterests: 0,
    fosteringInterests: 0,
    totalInterests: 0,
    commentCount: 0,
    followerCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [dogId]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('dog_interaction_stats')
        .select('*')
        .eq('dog_id', dogId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setStats({
          adoptionInterests: data.adoption_interests || 0,
          fosteringInterests: data.fostering_interests || 0,
          totalInterests: data.total_interests || 0,
          commentCount: data.comment_count || 0,
          followerCount: data.follower_count || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching dog stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || stats.totalInterests === 0 && stats.commentCount === 0 && stats.followerCount === 0) {
    return null;
  }

  const iconSize = size === 'small' ? 14 : 16;
  const textStyle = size === 'small' ? styles.smallText : styles.mediumText;

  return (
    <View style={styles.container}>
      {stats.totalInterests > 0 && (
        <View style={styles.stat}>
          <Ionicons name="heart" size={iconSize} color={Colors.danger} />
          <Text style={[textStyle, { color: Colors.danger }]}>
            {stats.totalInterests}
          </Text>
        </View>
      )}
      
      {stats.commentCount > 0 && (
        <View style={styles.stat}>
          <Ionicons name="chatbubble" size={iconSize} color={Colors.primary} />
          <Text style={[textStyle, { color: Colors.primary }]}>
            {stats.commentCount}
          </Text>
        </View>
      )}
      
      {stats.followerCount > 0 && (
        <View style={styles.stat}>
          <Ionicons name="eye" size={iconSize} color={Colors.secondary} />
          <Text style={[textStyle, { color: Colors.secondary }]}>
            {stats.followerCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  smallText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  mediumText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
});