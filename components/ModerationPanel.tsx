import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useModeration, type ContentReport } from '@/hooks/moderation-store';
import { Colors } from '@/constants/colors';

interface ReportItemProps {
  report: ContentReport;
  onReview: (reportId: string, status: 'reviewed' | 'resolved' | 'dismissed') => void;
  onModerate: (params: {
    actionType: 'approve' | 'hide' | 'delete' | 'flag' | 'warn_user';
    targetType: 'comment' | 'dog' | 'user' | 'interest';
    targetId: string;
    reason?: string;
    notes?: string;
  }) => void;
}

const ReportItem: React.FC<ReportItemProps> = ({ report, onReview, onModerate }) => {
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationReason, setModerationReason] = useState('');
  const [moderationNotes, setModerationNotes] = useState('');

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'spam':
        return '#FF9800';
      case 'inappropriate':
        return '#F44336';
      case 'fake':
        return '#9C27B0';
      case 'harassment':
        return '#D32F2F';
      case 'other':
        return '#607D8B';
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'reviewed':
        return '#2196F3';
      case 'resolved':
        return '#4CAF50';
      case 'dismissed':
        return '#9E9E9E';
      default:
        return Colors.textSecondary;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleModerate = (actionType: 'approve' | 'hide' | 'delete' | 'flag' | 'warn_user') => {
    onModerate({
      actionType,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: moderationReason || undefined,
      notes: moderationNotes || undefined,
    });
    setShowModerationModal(false);
    setModerationReason('');
    setModerationNotes('');
  };

  const renderTargetDetails = () => {
    if (!report.targetDetails) return null;

    switch (report.targetType) {
      case 'comment':
        return (
          <View style={styles.targetDetails}>
            <Text style={styles.targetLabel}>Comment:</Text>
            <Text style={styles.targetContent} numberOfLines={3}>
              "{report.targetDetails.content}"
            </Text>
            <Text style={styles.targetMeta}>
              By {report.targetDetails.user_name} on {report.targetDetails.dog_name}
            </Text>
          </View>
        );
      case 'dog':
        return (
          <View style={styles.targetDetails}>
            <Text style={styles.targetLabel}>Dog:</Text>
            <Text style={styles.targetContent}>
              {report.targetDetails.name} ({report.targetDetails.status})
            </Text>
            {report.targetDetails.description && (
              <Text style={styles.targetMeta} numberOfLines={2}>
                {report.targetDetails.description}
              </Text>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <View style={styles.reportItem}>
        <View style={styles.reportHeader}>
          <View style={styles.reportInfo}>
            <View style={styles.reasonBadge}>
              <View style={[styles.reasonDot, { backgroundColor: getReasonColor(report.reason) }]} />
              <Text style={styles.reasonText}>{report.reason}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
              <Text style={styles.statusText}>{report.status}</Text>
            </View>
          </View>
          <Text style={styles.reportTime}>{formatTime(report.createdAt)}</Text>
        </View>

        <Text style={styles.reportedBy}>
          Reported by {report.reporterName || 'Unknown User'}
        </Text>

        {report.description && (
          <Text style={styles.reportDescription}>{report.description}</Text>
        )}

        {renderTargetDetails()}

        {report.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.reviewButton]}
              onPress={() => setShowModerationModal(true)}
            >
              <Ionicons name="shield-checkmark" size={16} color="white" />
              <Text style={styles.actionButtonText}>Moderate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.dismissButton]}
              onPress={() => onReview(report.id, 'dismissed')}
            >
              <Ionicons name="close" size={16} color="white" />
              <Text style={styles.actionButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {report.reviewedBy && report.reviewedAt && (
          <Text style={styles.reviewInfo}>
            Reviewed by {report.reviewerName} on {formatTime(report.reviewedAt)}
          </Text>
        )}
      </View>

      <Modal
        visible={showModerationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModerationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Moderate Content</Text>
              <TouchableOpacity onPress={() => setShowModerationModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Reason (optional)"
              value={moderationReason}
              onChangeText={setModerationReason}
              multiline
            />

            <TextInput
              style={styles.input}
              placeholder="Notes (optional)"
              value={moderationNotes}
              onChangeText={setModerationNotes}
              multiline
            />

            <View style={styles.moderationActions}>
              <TouchableOpacity
                style={[styles.moderationButton, styles.approveButton]}
                onPress={() => handleModerate('approve')}
              >
                <Text style={styles.moderationButtonText}>Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.moderationButton, styles.hideButton]}
                onPress={() => handleModerate('hide')}
              >
                <Text style={styles.moderationButtonText}>Hide</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.moderationButton, styles.deleteButton]}
                onPress={() => handleModerate('delete')}
              >
                <Text style={styles.moderationButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export const ModerationPanel: React.FC = () => {
  const {
    reports,
    pendingReportsCount,
    isLoading,
    reviewReport,
    moderateContent,
    isAdmin,
    refresh,
  } = useModeration();

  if (!isAdmin) {
    return (
      <View style={styles.noAccessContainer}>
        <Ionicons name="shield-outline" size={48} color={Colors.textSecondary} />
        <Text style={styles.noAccessText}>Access Denied</Text>
        <Text style={styles.noAccessSubtext}>
          You need admin or volunteer permissions to access moderation tools
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Content Moderation {pendingReportsCount > 0 && `(${pendingReportsCount} pending)`}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyStateText}>No reports</Text>
            <Text style={styles.emptyStateSubtext}>
              All content appears to be in good standing
            </Text>
          </View>
        ) : (
          reports.map((report) => (
            <ReportItem
              key={report.id}
              report={report}
              onReview={reviewReport}
              onModerate={moderateContent}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  reportItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  reasonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  reportTime: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  reportedBy: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  targetDetails: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  targetContent: {
    fontSize: 13,
    color: Colors.text,
    marginBottom: 4,
  },
  targetMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  reviewButton: {
    backgroundColor: Colors.primary,
  },
  dismissButton: {
    backgroundColor: '#9E9E9E',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  reviewInfo: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  moderationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moderationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  hideButton: {
    backgroundColor: '#FF9800',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  moderationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: Colors.background,
  },
  noAccessText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  noAccessSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});