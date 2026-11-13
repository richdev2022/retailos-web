import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/lib/services';

export function useAuth() {
  const { user, accessToken, isAuthenticated, setAuth, setUser, logout } = useAuthStore();

  const { data: me, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.me,
    enabled: !!accessToken && !user,
    staleTime: 5 * 60_000,
  });

  React.useEffect(() => {
    if (me && !user) setUser(me);
  }, [me, user, setUser]);

  return {
    user: user ?? me ?? null,
    accessToken,
    isAuthenticated: isAuthenticated || !!accessToken,
    isLoading,
    setAuth,
    setUser,
    logout,
  };
}
