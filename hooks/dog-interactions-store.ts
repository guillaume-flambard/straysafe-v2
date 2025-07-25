import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-store';
import { showToast } from '@/utils/toast';
import { 
  DogInterest, 
  DogComment, 
  DogFollowing, 
  DogCommentWithUser, 
  InterestType 
} from '@/types';

export function useDogInteractions(dogId: string) {
  const { user } = useAuth();
  const [interests, setInterests] = useState<DogInterest[]>([]);
  const [comments, setComments] = useState<DogCommentWithUser[]>([]);
  const [following, setFollowing] = useState<DogFollowing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch all interactions for a dog
  const fetchInteractions = useCallback(async () => {
    if (!dogId) return;

    try {
      setLoading(true);
      
      // Fetch interests
      const { data: interestsData, error: interestsError } = await supabase
        .from('dog_interests')
        .select('*')
        .eq('dog_id', dogId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (interestsError) throw interestsError;

      // Fetch comments (simplified)
      const { data: commentsData, error: commentsError } = await supabase
        .from('dog_comments')
        .select('*')
        .eq('dog_id', dogId)
        .eq('is_deleted', false)
        .is('parent_id', null) // Only top-level comments
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Check if current user is following this dog
      let followingData = null;
      if (user) {
        const { data: followData, error: followError } = await supabase
          .from('dog_following')
          .select('*')
          .eq('dog_id', dogId)
          .eq('user_id', user.id)
          .single();

        if (followError && followError.code !== 'PGRST116') {
          throw followError;
        }
        
        // Transform snake_case to camelCase if data exists
        if (followData) {
          followingData = {
            id: followData.id,
            dogId: followData.dog_id,
            userId: followData.user_id,
            notificationsEnabled: followData.notifications_enabled,
            createdAt: followData.created_at,
          };
        }
      }

      // Transform data
      const transformedInterests: DogInterest[] = (interestsData || []).map(item => ({
        id: item.id,
        dogId: item.dog_id,
        userId: item.user_id,
        type: item.type as InterestType,
        message: item.message,
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      const transformedComments: DogCommentWithUser[] = (commentsData || []).map(item => ({
        id: item.id,
        dogId: item.dog_id,
        userId: item.user_id,
        content: item.content,
        parentId: item.parent_id,
        isModerated: item.is_moderated,
        isDeleted: item.is_deleted,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        user: {
          id: item.user_id,
          name: 'Anonymous User',
          avatar: undefined,
          role: 'viewer',
        },
        replies: [],
      }));

      setInterests(transformedInterests);
      setComments(transformedComments);
      setFollowing(followingData);

    } catch (error) {
      console.error('Error fetching dog interactions:', error?.message || error);
      showToast('Failed to load interactions', 'error');
    } finally {
      setLoading(false);
    }
  }, [dogId, user]);

  // Express interest in a dog
  const expressInterest = async (type: InterestType, message?: string) => {
    if (!user) {
      showToast('Please sign in to express interest', 'error');
      return false;
    }

    try {
      setSubmitting(true);

      // Check if user already has an active interest
      const { data: existing } = await supabase
        .from('dog_interests')
        .select('id')
        .eq('dog_id', dogId)
        .eq('user_id', user.id)
        .eq('type', type)
        .in('status', ['pending', 'approved'])
        .single();

      if (existing) {
        showToast(`You already expressed interest in ${type}`, 'warning');
        return false;
      }

      const { error } = await supabase
        .from('dog_interests')
        .insert({
          dog_id: dogId,
          user_id: user.id,
          type,
          message,
          status: 'pending'
        });

      if (error) throw error;

      showToast(`Interest in ${type} submitted successfully!`, 'success');
      await fetchInteractions(); // Refresh data
      return true;

    } catch (error) {
      console.error('Error expressing interest:', error?.message || error);
      showToast('Failed to submit interest', 'error');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Add a comment
  const addComment = async (content: string, parentId?: string) => {
    if (!user) {
      showToast('Please sign in to comment', 'error');
      return false;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('dog_comments')
        .insert({
          dog_id: dogId,
          user_id: user.id,
          content,
          parent_id: parentId,
          is_moderated: false,
          is_deleted: false
        });

      if (error) throw error;

      showToast('Comment added successfully!', 'success');
      await fetchInteractions(); // Refresh data
      return true;

    } catch (error) {
      console.error('Error adding comment:', error?.message || error);
      showToast('Failed to add comment', 'error');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Follow/unfollow a dog
  const toggleFollowing = async (enableNotifications = true) => {
    if (!user) {
      showToast('Please sign in to follow dogs', 'error');
      return false;
    }

    try {
      setSubmitting(true);

      if (following) {
        // Unfollow
        const { error } = await supabase
          .from('dog_following')
          .delete()
          .eq('id', following.id);

        if (error) throw error;
        showToast('Unfollowed dog', 'success');
      } else {
        // Follow
        const { error } = await supabase
          .from('dog_following')
          .insert({
            dog_id: dogId,
            user_id: user.id,
            notifications_enabled: enableNotifications
          });

        if (error) throw error;
        showToast('Now following dog', 'success');
      }

      await fetchInteractions(); // Refresh data
      return true;

    } catch (error) {
      console.error('Error toggling follow:', error?.message || error);
      showToast('Failed to update following status', 'error');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Get current user's interest status
  const getUserInterest = (type: InterestType): DogInterest | null => {
    if (!user) return null;
    return interests.find(interest => 
      interest.userId === user.id && 
      interest.type === type && 
      interest.status === 'pending'
    ) || null;
  };

  // Check if user can express interest (not already pending/approved)
  const canExpressInterest = (type: InterestType): boolean => {
    if (!user) return false;
    return !interests.some(interest => 
      interest.userId === user.id && 
      interest.type === type && 
      ['pending', 'approved'].includes(interest.status)
    );
  };

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  return {
    // Data
    interests,
    comments,
    following,
    loading,
    submitting,

    // Actions
    expressInterest,
    addComment,
    toggleFollowing,
    fetchInteractions,

    // Utilities
    getUserInterest,
    canExpressInterest,
    isFollowing: !!following,
  };
}