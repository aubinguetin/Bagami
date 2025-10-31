import React from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  canRefresh: boolean;
  className?: string;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  isPulling,
  isRefreshing,
  pullDistance,
  canRefresh,
  className = ''
}) => {
  if (!isPulling && !isRefreshing) return null;

  const opacity = Math.min(pullDistance / 60, 1);
  const scale = Math.min(pullDistance / 60, 1);

  return (
    <div 
      className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-center py-4 bg-gradient-to-b from-white to-transparent ${className}`}
      style={{
        transform: `translateY(${Math.min(pullDistance - 60, 0)}px)`,
        opacity
      }}
    >
      <div 
        className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
          isRefreshing 
            ? 'bg-blue-100 text-blue-700' 
            : canRefresh 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-500'
        }`}
        style={{ transform: `scale(${scale})` }}
      >
        {isRefreshing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Refreshing...</span>
          </>
        ) : canRefresh ? (
          <>
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">Release to refresh</span>
          </>
        ) : (
          <>
            <ArrowDown className="w-4 h-4" />
            <span className="text-sm font-medium">Pull to refresh</span>
          </>
        )}
      </div>
    </div>
  );
};