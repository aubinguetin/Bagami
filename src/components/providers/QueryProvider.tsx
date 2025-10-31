'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create QueryClient with optimized settings
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          // Cache data for 5 minutes by default
          staleTime: 5 * 60 * 1000, // 5 minutes
          // Keep data in cache for 10 minutes after component unmounts
          gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection time)
          // Retry failed requests 3 times
          retry: 3,
          // Refetch on window focus for fresh data
          refetchOnWindowFocus: true,
          // Refetch when network comes back online
          refetchOnReconnect: true,
          // Don't refetch on mount if data is fresh
          refetchOnMount: 'always',
        },
        mutations: {
          // Retry failed mutations once
          retry: 1,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}