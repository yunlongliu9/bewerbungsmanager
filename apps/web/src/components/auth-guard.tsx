'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { LoadingState } from './page-state';
import { useAuth } from './auth-provider';

export function AuthGuard({ children }: Readonly<{ children: ReactNode }>) {
  const { owner, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !owner) {
      router.replace('/login');
    }
  }, [loading, owner, router]);

  if (loading || !owner) {
    return <LoadingState label="Checking session" />;
  }

  return children;
}
