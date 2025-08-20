import { useState, useEffect, useCallback } from 'react';

interface CompletedJob {
  job_id: number;
  result_cid: string;
  completed_at: number;
  ipfs_gateway_url: string;
}

interface UseCompletedJobsReturn {
  jobs: CompletedJob[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useCompletedJobs = (
  refreshInterval = 10000
): UseCompletedJobsReturn => {
  const [jobs, setJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch('/api/completed-jobs');
      const data = await response.json();
      
      if (data.success) {
        setJobs(data.jobs);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch completed jobs');
      }
    } catch (err) {
      setError('Network error while fetching completed jobs');
      console.error('Error fetching completed jobs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchJobs();

    // Set up polling if interval is provided
    if (refreshInterval > 0) {
      const interval = setInterval(fetchJobs, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchJobs, refreshInterval]);

  return {
    jobs,
    loading,
    error,
    refresh: fetchJobs
  };
};
