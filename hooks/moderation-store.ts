import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-store';

export interface ContentReport {
  id: string;
  reporterId: string;
  targetType: 'comment' | 'dog' | 'user' | 'interest';
  targetId: string;
  reason: 'spam' | 'inappropriate' | 'fake' | 'harassment' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  reporterName?: string;
  reviewerName?: string;
  targetDetails?: any;
}

export interface ModerationAction {
  id: string;
  moderatorId: string;
  actionType: 'approve' | 'hide' | 'delete' | 'flag' | 'warn_user';
  targetType: 'comment' | 'dog' | 'user' | 'interest';
  targetId: string;
  reason?: string;
  notes?: string;
  createdAt: string;
}

export const useModeration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'admin' || user?.role === 'volunteer';

  // Fetch content reports
  const reportsQuery = useQuery({
    queryKey: ['content-reports'],
    queryFn: async () => {
      if (!isAdmin) return [];

      const { data, error } = await supabase
        .from('reports_with_details')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching reports:', error);
        throw error;
      }

      return (data || []).map(report => ({
        id: report.id,
        reporterId: report.reporter_id,
        targetType: report.target_type,
        targetId: report.target_id,
        reason: report.reason,
        description: report.description,
        status: report.status,
        reviewedBy: report.reviewed_by,
        reviewedAt: report.reviewed_at,
        createdAt: report.created_at,
        reporterName: report.reporter_name,
        reviewerName: report.reviewer_name,
        targetDetails: report.target_details,
      })) as ContentReport[];
    },
    enabled: isAdmin,
    staleTime: 30000,
  });

  // Fetch moderation actions
  const actionsQuery = useQuery({
    queryKey: ['moderation-actions'],
    queryFn: async () => {
      if (!isAdmin) return [];

      const { data, error } = await supabase
        .from('moderation_actions')
        .select(`
          *,
          moderator:profiles!moderation_actions_moderator_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching moderation actions:', error);
        throw error;
      }

      return (data || []).map(action => ({
        id: action.id,
        moderatorId: action.moderator_id,
        actionType: action.action_type,
        targetType: action.target_type,
        targetId: action.target_id,
        reason: action.reason,
        notes: action.notes,
        createdAt: action.created_at,
        moderatorName: action.moderator?.full_name,
      })) as (ModerationAction & { moderatorName?: string })[];
    },
    enabled: isAdmin,
    staleTime: 30000,
  });

  // Get pending reports count
  const pendingReportsQuery = useQuery({
    queryKey: ['pending-reports-count'],
    queryFn: async () => {
      if (!isAdmin) return 0;

      const { count, error } = await supabase
        .from('content_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching pending reports count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: isAdmin,
    staleTime: 30000,
  });

  // Report content
  const reportContentMutation = useMutation({
    mutationFn: async (params: {
      targetType: 'comment' | 'dog' | 'user' | 'interest';
      targetId: string;
      reason: 'spam' | 'inappropriate' | 'fake' | 'harassment' | 'other';
      description?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('content_reports')
        .insert({
          reporter_id: user.id,
          target_type: params.targetType,
          target_id: params.targetId,
          reason: params.reason,
          description: params.description,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-reports'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reports-count'] });
    },
  });

  // Take moderation action
  const moderateContentMutation = useMutation({
    mutationFn: async (params: {
      actionType: 'approve' | 'hide' | 'delete' | 'flag' | 'warn_user';
      targetType: 'comment' | 'dog' | 'user' | 'interest';
      targetId: string;
      reason?: string;
      notes?: string;
    }) => {
      if (!user || !isAdmin) throw new Error('User not authorized');

      const { error } = await supabase
        .from('moderation_actions')
        .insert({
          moderator_id: user.id,
          action_type: params.actionType,
          target_type: params.targetType,
          target_id: params.targetId,
          reason: params.reason,
          notes: params.notes,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-actions'] });
      queryClient.invalidateQueries({ queryKey: ['content-reports'] });
    },
  });

  // Review report
  const reviewReportMutation = useMutation({
    mutationFn: async (params: {
      reportId: string;
      status: 'reviewed' | 'resolved' | 'dismissed';
    }) => {
      if (!user || !isAdmin) throw new Error('User not authorized');

      const { error } = await supabase
        .from('content_reports')
        .update({
          status: params.status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', params.reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-reports'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reports-count'] });
    },
  });

  const reportContent = (params: {
    targetType: 'comment' | 'dog' | 'user' | 'interest';
    targetId: string;
    reason: 'spam' | 'inappropriate' | 'fake' | 'harassment' | 'other';
    description?: string;
  }) => {
    reportContentMutation.mutate(params);
  };

  const moderateContent = (params: {
    actionType: 'approve' | 'hide' | 'delete' | 'flag' | 'warn_user';
    targetType: 'comment' | 'dog' | 'user' | 'interest';
    targetId: string;
    reason?: string;
    notes?: string;
  }) => {
    moderateContentMutation.mutate(params);
  };

  const reviewReport = (reportId: string, status: 'reviewed' | 'resolved' | 'dismissed') => {
    reviewReportMutation.mutate({ reportId, status });
  };

  return {
    reports: reportsQuery.data || [],
    actions: actionsQuery.data || [],
    pendingReportsCount: pendingReportsQuery.data || 0,
    isLoading: reportsQuery.isLoading || actionsQuery.isLoading,
    error: reportsQuery.error || actionsQuery.error,
    reportContent,
    moderateContent,
    reviewReport,
    isAdmin,
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['content-reports'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-actions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reports-count'] });
    },
  };
};