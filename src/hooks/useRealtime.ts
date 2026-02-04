

import { useState, useEffect, useRef } from 'react';
import { api, apiCall } from '../api';

// Generic hook for real-time data fetching
export function useRealtime<T>(
  endpoint: string,
  interval: number = 5000,
  token?: string
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isServerAvailable, setIsServerAvailable] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      
      // Check if server is available
      if (!isServerAvailable) {
        setData(null);
        setLoading(false);
        return;
      }
      
      // Parse endpoint to determine type
      if (endpoint.includes('/content/news')) {
        const response = await api.getContent('news', token);
        setData(response);
      } else if (endpoint.includes('/content/events')) {
        const response = await api.getContent('events', token);
        setData(response);
      } else {
        // Fallback to generic API call
        const response = await apiCall(endpoint, 'GET', undefined, token);
        setData(response);
      }
      
      setIsServerAvailable(true);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      
      // If it's a 404, server might not be running - don't retry
      if (errorMessage.includes('404') || errorMessage.includes('Route not found')) {
        setIsServerAvailable(false);
        setError('Backend server not available. Content management features are limited.');
        setData(null);
      } else {
        setError(errorMessage);
        // Keep existing data if available
      }
      
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if server is available
    if (isServerAvailable) {
      // Initial fetch
      fetchData();

      // Set up interval for real-time updates
      intervalRef.current = setInterval(fetchData, interval);
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [endpoint, interval, token, isServerAvailable]);

  const refetch = () => {
    setLoading(true);
    fetchData();
  };

  return { data, loading, error, refetch };
}
