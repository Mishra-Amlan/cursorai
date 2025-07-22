import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, User, Property, Audit } from '@/utils/api';

// Properties hooks
export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: () => apiClient.getProperties(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProperty(id: number) {
  return useQuery({
    queryKey: ['properties', id],
    queryFn: () => apiClient.getProperty(id),
    enabled: !!id,
  });
}

// Audits hooks
export function useAudits(params?: {
  auditor_id?: number;
  reviewer_id?: number;
  property_id?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: ['audits', params],
    queryFn: () => apiClient.getAudits(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useAudit(id: number) {
  return useQuery({
    queryKey: ['audits', id],
    queryFn: () => apiClient.getAudit(id),
    enabled: !!id,
  });
}

// AI features hooks
export function usePhotoAnalysis() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ imageBase64, context, auditItemId }: {
      imageBase64: string;
      context: string;
      auditItemId?: number;
    }) => apiClient.analyzePhoto(imageBase64, context, auditItemId),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
  });
}

export function useReportGeneration() {
  return useMutation({
    mutationFn: (auditId: number) => apiClient.generateReport(auditId),
  });
}

export function useScoreSuggestion() {
  return useMutation({
    mutationFn: ({ auditItemId, observations }: {
      auditItemId: number;
      observations: string;
    }) => apiClient.suggestScore(auditItemId, observations),
  });
}

// Health check hook
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 60000, // 1 minute
  });
}
