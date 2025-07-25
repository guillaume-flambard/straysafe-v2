import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Image, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DogCommentWithUser } from '@/types';
import { useAuth } from '@/hooks/auth-store';
import Colors from '@/constants/colors';
import Button from './Button';

interface DogCommentsProps {
  comments: DogCommentWithUser[];
  onAddComment: (content: string, parentId?: string) => Promise<boolean>;
  loading: boolean;
  submitting: boolean;
}

interface CommentItemProps {
  comment: DogCommentWithUser;
  onReply: (content: string, parentId: string) => Promise<boolean>;
  level: number;
}

function CommentItem({ comment, onReply, level }: CommentItemProps) {
  const { user } = useAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;

    setSubmitting(true);
    const success = await onReply(replyText.trim(), comment.id);
    setSubmitting(false);

    if (success) {
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return Colors.danger;
      case 'volunteer': return Colors.primary;
      case 'vet': return Colors.success;
      default: return Colors.textLight;
    }
  };

  return (
    <View style={[styles.commentContainer, level > 0 && styles.replyContainer]}>
      <View style={styles.commentHeader}>
        <Image
          source={{ 
            uri: comment.user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=32&h=32'
          }}
          style={styles.avatar}
        />
        <View style={styles.commentInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{comment.user.name}</Text>
            <Text style={[styles.userRole, { color: getRoleColor(comment.user.role) }]}>
              {comment.user.role}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            {formatTimeAgo(comment.createdAt)}
          </Text>
        </View>
      </View>

      <Text style={styles.commentContent}>{comment.content}</Text>

      {level === 0 && user && (
        <View style={styles.commentActions}>
          <Pressable
            style={styles.replyButton}
            onPress={() => setShowReplyInput(!showReplyInput)}
          >
            <Ionicons name="arrow-undo" size={14} color={Colors.primary} />
            <Text style={styles.replyButtonText}>Reply</Text>
          </Pressable>
        </View>
      )}

      {showReplyInput && (
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Write a reply..."
            placeholderTextColor={Colors.textLight}
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={500}
          />
          <View style={styles.replyActions}>
            <Button
              title="Cancel"
              onPress={() => {
                setShowReplyInput(false);
                setReplyText('');
              }}
              variant="outline"
              style={styles.replyActionButton}
            />
            <Button
              title="Reply"
              onPress={handleReply}
              disabled={!replyText.trim() || submitting}
              loading={submitting}
              style={styles.replyActionButton}
            />
          </View>
        </View>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              level={level + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function DogComments({ comments, onAddComment, loading, submitting }: DogCommentsProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const success = await onAddComment(newComment.trim());
    if (success) {
      setNewComment('');
    }
  };

  const handleReply = async (content: string, parentId: string) => {
    return await onAddComment(content, parentId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Comments ({comments.length})</Text>
      </View>

      {user && (
        <View style={styles.addCommentContainer}>
          <Image
            source={{ 
              uri: user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=32&h=32'
            }}
            style={styles.avatar}
          />
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={Colors.textLight}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <Button
              title="Post"
              onPress={handleAddComment}
              disabled={!newComment.trim() || submitting}
              loading={submitting}
              style={styles.postButton}
            />
          </View>
        </View>
      )}

      {!user && (
        <View style={styles.signInPrompt}>
          <Text style={styles.signInText}>
            Sign in to comment and interact with this dog's profile
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading comments...</Text>
        </View>
      ) : comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={48} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>No comments yet</Text>
          <Text style={styles.emptySubtitle}>
            Be the first to ask a question or share your thoughts about this dog
          </Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CommentItem comment={item} onReply={handleReply} level={0} />
          )}
          showsVerticalScrollIndicator={false}
          style={styles.commentsList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  inputContainer: {
    flex: 1,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  postButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
  },
  signInPrompt: {
    backgroundColor: Colors.border,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  commentsList: {
    maxHeight: 400,
  },
  commentContainer: {
    marginBottom: 16,
  },
  replyContainer: {
    marginLeft: 20,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: Colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  commentContent: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  replyButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  replyInputContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
    marginBottom: 8,
    maxHeight: 80,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  replyActionButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
  },
  repliesContainer: {
    marginTop: 8,
  },
});