import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to set up real-time subscriptions for Admin Dashboard data.
 * Automatically invalidates React Query caches when relevant data changes.
 */
export function useRealtimeAdmin() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to onboarding_cases changes
    const casesChannel = supabase
      .channel('admin-cases')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'onboarding_cases'
        },
        (payload) => {
          console.log('Admin Realtime: onboarding_cases changed', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['admin-supervisor-pipelines'] });
          queryClient.invalidateQueries({ queryKey: ['admin-global-metrics'] });
          queryClient.invalidateQueries({ queryKey: ['admin-trends'] });
        }
      )
      .subscribe();

    // Subscribe to case_lender_applications changes
    const lenderAppsChannel = supabase
      .channel('admin-lender-apps')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'case_lender_applications'
        },
        (payload) => {
          console.log('Admin Realtime: case_lender_applications changed', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['admin-lender-performance'] });
          queryClient.invalidateQueries({ queryKey: ['admin-global-metrics'] });
        }
      )
      .subscribe();

    // Subscribe to lenders changes
    const lendersChannel = supabase
      .channel('admin-lenders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'onboarding_lenders'
        },
        (payload) => {
          console.log('Admin Realtime: onboarding_lenders changed', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['admin-lenders'] });
          queryClient.invalidateQueries({ queryKey: ['admin-lender-performance'] });
        }
      )
      .subscribe();

    // Subscribe to agents changes
    const agentsChannel = supabase
      .channel('admin-agents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agents'
        },
        (payload) => {
          console.log('Admin Realtime: agents changed', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['admin-global-metrics'] });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(casesChannel);
      supabase.removeChannel(lenderAppsChannel);
      supabase.removeChannel(lendersChannel);
      supabase.removeChannel(agentsChannel);
    };
  }, [queryClient]);
}
