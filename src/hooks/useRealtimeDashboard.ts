import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to set up real-time subscriptions for dashboard data.
 * Automatically invalidates React Query caches when relevant data changes.
 */
export function useRealtimeDashboard() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to onboarding_cases changes
    const casesChannel = supabase
      .channel('dashboard-cases')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'onboarding_cases'
        },
        (payload) => {
          console.log('Realtime: onboarding_cases changed', payload.eventType);
          // Invalidate all dashboard-related queries
          queryClient.invalidateQueries({ queryKey: ['supervisor-pipeline'] });
          queryClient.invalidateQueries({ queryKey: ['sla-metrics'] });
          queryClient.invalidateQueries({ queryKey: ['sla-cases'] });
        }
      )
      .subscribe();

    // Subscribe to case_lender_applications changes
    const lenderAppsChannel = supabase
      .channel('dashboard-lender-apps')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'case_lender_applications'
        },
        (payload) => {
          console.log('Realtime: case_lender_applications changed', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['lender-applications'] });
          queryClient.invalidateQueries({ queryKey: ['lender-summary'] });
        }
      )
      .subscribe();

    // Subscribe to agents changes (for productivity tracking)
    const agentsChannel = supabase
      .channel('dashboard-agents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agents'
        },
        (payload) => {
          console.log('Realtime: agents changed', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['agent-productivity'] });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(casesChannel);
      supabase.removeChannel(lenderAppsChannel);
      supabase.removeChannel(agentsChannel);
    };
  }, [queryClient]);
}

/**
 * Hook for real-time lender tracking updates only
 */
export function useRealtimeLenderTracking() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('lender-tracking-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'case_lender_applications'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lender-applications'] });
          queryClient.invalidateQueries({ queryKey: ['lender-summary'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/**
 * Hook for real-time SLA monitoring updates only
 */
export function useRealtimeSLAMonitoring() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('sla-monitoring-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'onboarding_cases'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sla-metrics'] });
          queryClient.invalidateQueries({ queryKey: ['sla-cases'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
