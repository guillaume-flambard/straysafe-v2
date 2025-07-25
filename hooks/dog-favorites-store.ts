import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-store';
import { Dog } from '@/types';

export interface FavoriteDog extends Dog {
  favoriteId: string;
  favoritedAt: string;
  totalInterests: number;
  commentCount: number;
  followingCount: number;
}

export const useDogFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's favorite dogs
  const favoritesQuery = useQuery({
    queryKey: ['dog-favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('favorites_with_dogs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching favorite dogs:', error);
        throw error;
      }

      return (data || []).map(fav => ({
        id: fav.dog_id,
        name: fav.name,
        status: fav.status,
        gender: fav.gender,
        locationId: fav.location_id,
        breed: fav.breed,
        age: fav.age,
        description: fav.description,
        lastSeen: null,
        lastSeenLocation: null,
        medicalNotes: null,
        isNeutered: false,
        isVaccinated: false,
        mainImage: fav.main_image,
        createdAt: fav.created_at,
        updatedAt: fav.created_at,
        createdBy: null,
        favoriteId: fav.id,
        favoritedAt: fav.created_at,
        totalInterests: fav.total_interests || 0,
        commentCount: fav.comment_count || 0,
        followingCount: fav.following_count || 0,
      })) as FavoriteDog[];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Check if a dog is favorited
  const isFavoritedQuery = (dogId: string) => useQuery({
    queryKey: ['dog-is-favorited', user?.id, dogId],
    queryFn: async () => {
      if (!user || !dogId) return false;

      const { data, error } = await supabase
        .from('dog_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('dog_id', dogId)
        .maybeSingle();

      if (error) {
        console.error('Error checking if dog is favorited:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!user && !!dogId,
    staleTime: 30000,
  });

  // Add dog to favorites
  const addToFavoritesMutation = useMutation({
    mutationFn: async (dogId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('dog_favorites')
        .insert({
          user_id: user.id,
          dog_id: dogId,
        });

      if (error) throw error;
    },
    onSuccess: (_, dogId) => {
      queryClient.invalidateQueries({ queryKey: ['dog-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['dog-is-favorited', user?.id, dogId] });
    },
  });

  // Remove dog from favorites
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async (dogId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('dog_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('dog_id', dogId);

      if (error) throw error;
    },
    onSuccess: (_, dogId) => {
      queryClient.invalidateQueries({ queryKey: ['dog-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['dog-is-favorited', user?.id, dogId] });
    },
  });

  // Toggle favorite status
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (dogId: string) => {
      if (!user) throw new Error('User not authenticated');

      // Check if already favorited
      const { data: existingFavorite, error: checkError } = await supabase
        .from('dog_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('dog_id', dogId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('dog_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('dog_id', dogId);

        if (error) throw error;
        return { action: 'removed', dogId };
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('dog_favorites')
          .insert({
            user_id: user.id,
            dog_id: dogId,
          });

        if (error) throw error;
        return { action: 'added', dogId };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['dog-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['dog-is-favorited', user?.id, result.dogId] });
    },
  });

  const addToFavorites = (dogId: string) => {
    addToFavoritesMutation.mutate(dogId);
  };

  const removeFromFavorites = (dogId: string) => {
    removeFromFavoritesMutation.mutate(dogId);
  };

  const toggleFavorite = (dogId: string) => {
    return toggleFavoriteMutation.mutateAsync(dogId);
  };

  const isFavorited = (dogId: string) => {
    const query = isFavoritedQuery(dogId);
    return query.data || false;
  };

  return {
    favorites: favoritesQuery.data || [],
    isLoading: favoritesQuery.isLoading,
    error: favoritesQuery.error,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorited,
    isFavoritedQuery,
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['dog-favorites'] });
    },
  };
};