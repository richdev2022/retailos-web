import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBusinessStore } from '@/stores/business-store';
import { businessService, branchService } from '@/lib/services';
import { useAuthStore } from '@/stores/auth-store';

export function useBusinesses() {
  const { accessToken } = useAuthStore();
  const { setBusinesses, activeBusinessId } = useBusinessStore();
  const query = useQuery({
    queryKey: ['businesses'],
    queryFn: businessService.list,
    enabled: !!accessToken,
    staleTime: 60_000,
  });
  React.useEffect(() => {
    if (query.data) setBusinesses(query.data);
  }, [query.data, setBusinesses]);
  void activeBusinessId;
  return query;
}

export function useBranches() {
  const { accessToken } = useAuthStore();
  const { activeBusinessId, setBranches } = useBusinessStore();
  const query = useQuery({
    queryKey: ['branches', activeBusinessId],
    queryFn: branchService.list,
    enabled: !!accessToken && !!activeBusinessId,
    staleTime: 60_000,
  });
  React.useEffect(() => {
    if (query.data) setBranches(query.data);
  }, [query.data, setBranches]);
  return query;
}

export function useActiveBusiness() {
  const { activeBusiness, activeBusinessId, setActiveBusiness, branches, activeBranchId, setActiveBranch } = useBusinessStore();
  return { activeBusiness, activeBusinessId, setActiveBusiness, branches, activeBranchId, setActiveBranch };
}
