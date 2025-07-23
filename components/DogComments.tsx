import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/auth-store';

interface Comment {
  id: string;
  content: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url?: string;
  } | {
    id: string;
    full_name: string;
    avatar_url?: string;
  }[];
}

interface DogCommentsProps {
  dogId: string;
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function DogComments({ 
  comments, 
  onAddComment, 
  onDeleteComment,
  isLoading = false,
  hasMore = false,
  onLoadMore 
}: DogCommentsProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSubmitComment = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to comment.');
      return;
    }

    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment.');
      return;
    }

    if (newComment.length > 1000) {
      Alert.alert('Error', 'Comment is too long. Maximum 1000 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
      inputRef.current?.blur();
    } catch (error) {
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDeleteComment(commentId)
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    }
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    
    return (
      <View className="flex-row p-4 border-b border-gray-100">
        <View className="mr-3">
          {profile?.avatar_url ? (
            <Image 
              source={{ uri: profile.avatar_url }} 
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
              <Ionicons name="person" size={20} color="#6B7280" />
            </View>
          )}
        </View>
        
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="font-semibold text-gray-900">
              {profile?.full_name || 'Unknown User'}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-500 mr-2">
                {formatDate(item.created_at)}
              </Text>
              {user?.id === profile?.id && (
                <TouchableOpacity
                  onPress={() => handleDeleteComment(item.id)}
                  className="p-1"
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        
          <Text className="text-gray-700 leading-5">
            {item.content}
          </Text>
        
          {item.updated_at !== item.created_at && (
            <Text className="text-xs text-gray-400 mt-1">
              Edited {formatDate(item.updated_at)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View className="py-4">
        {isLoading ? (
          <ActivityIndicator color="#3B82F6" />
        ) : (
          <TouchableOpacity onPress={onLoadMore} className="items-center">
            <Text className="text-blue-500 font-medium">Load more comments</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <View className="border-b border-gray-200 px-4 py-3">
        <Text className="text-lg font-bold text-gray-900">
          Comments ({comments.length})
        </Text>
      </View>

      {comments.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
          <Text className="text-gray-500 text-center mt-4 text-lg">
            No comments yet
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Be the first to comment on this dog's profile
          </Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}

      {user && (
        <View className="border-t border-gray-200 p-4 bg-white">
          <View className="flex-row items-end space-x-3">
            {user.avatar ? (
              <Image 
                source={{ uri: user.avatar }} 
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center">
                <Ionicons name="person" size={16} color="#6B7280" />
              </View>
            )}
            
            <View className="flex-1">
              <TextInput
                ref={inputRef}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment..."
                multiline
                maxLength={1000}
                className="bg-gray-50 border border-gray-300 rounded-2xl px-4 py-3 max-h-24"
                style={{ textAlignVertical: 'top' }}
              />
              <Text className="text-xs text-gray-400 mt-1 text-right">
                {newComment.length}/1000
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isSubmitting || !newComment.trim() 
                  ? 'bg-gray-200' 
                  : 'bg-blue-500'
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : (
                <Ionicons 
                  name="send" 
                  size={18} 
                  color={newComment.trim() ? 'white' : '#6B7280'} 
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}