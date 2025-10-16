/**
 * React Query hooks for Jobs API
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jobsAPI, type Job, type JobCreate } from "@/lib/api-client";

// Query keys
export const jobKeys = {
  all: ["jobs"] as const,
  lists: () => [...jobKeys.all, "list"] as const,
  list: (filters?: Record<string, any>) =>
    [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, "detail"] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
  available: (filters?: Record<string, any>) =>
    [...jobKeys.all, "available", filters] as const,
  stats: () => [...jobKeys.all, "stats"] as const,
  events: (id: string) => [...jobKeys.detail(id), "events"] as const,
};

/**
 * Fetch jobs with optional filters
 */
export function useJobs(params?: {
  skip?: number;
  limit?: number;
  status?: string;
  creator_address?: string;
  worker_address?: string;
  min_reward?: number;
  min_reputation_required?: number;
}) {
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: () => jobsAPI.getJobs(params),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch single job by ID
 */
export function useJob(jobId: string | undefined) {
  return useQuery({
    queryKey: jobKeys.detail(jobId!),
    queryFn: () => jobsAPI.getJob(jobId!),
    enabled: !!jobId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch available jobs for workers
 */
export function useAvailableJobs(
  workerAddress?: string,
  skip?: number,
  limit?: number
) {
  return useQuery({
    queryKey: jobKeys.available({ workerAddress, skip, limit }),
    queryFn: () => jobsAPI.getAvailableJobs(workerAddress, skip, limit),
    staleTime: 20000, // 20 seconds
  });
}

/**
 * Fetch job statistics
 */
export function useJobStats() {
  return useQuery({
    queryKey: jobKeys.stats(),
    queryFn: () => jobsAPI.getJobStats(),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch job events/history
 */
export function useJobEvents(jobId: string, skip = 0, limit = 50) {
  return useQuery({
    queryKey: jobKeys.events(jobId),
    queryFn: () => jobsAPI.getJobEvents(jobId, skip, limit),
    enabled: !!jobId,
    staleTime: 30000,
  });
}

/**
 * Create a new job
 */
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JobCreate) => jobsAPI.createJob(data),
    onSuccess: (newJob) => {
      // Invalidate and refetch jobs list
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
    onError: (error: Error) => {
      console.error("Failed to create job:", error);
    },
  });
}

/**
 * Assign a job to a worker
 */
export function useAssignJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      workerAddress,
    }: {
      jobId: string;
      workerAddress: string;
    }) => jobsAPI.assignJob(jobId, workerAddress),
    onSuccess: (updatedJob) => {
      // Update the specific job in cache
      queryClient.setQueryData(jobKeys.detail(updatedJob.id), updatedJob);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.available() });
    },
    onError: (error: Error) => {
      console.error("Assignment failed:", error);
    },
  });
}

/**
 * Complete a job with results
 */
export function useCompleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      data,
    }: {
      jobId: string;
      data: {
        result_cid_part1: string;
        result_cid_part2?: string;
        quality_score: number;
        worker_address?: string;
      };
    }) => jobsAPI.completeJob(jobId, data),
    onSuccess: (updatedJob) => {
      // Update the specific job in cache
      queryClient.setQueryData(jobKeys.detail(updatedJob.id), updatedJob);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.stats() });
    },
    onError: (error: Error) => {
      console.error("Submission failed:", error);
    },
  });
}

/**
 * Get jobs for current user (as creator)
 */
export function useMyJobs(creatorAddress?: string) {
  return useJobs({
    creator_address: creatorAddress,
    limit: 100,
  });
}

/**
 * Get jobs by status for current user
 */
export function useMyJobsByStatus(creatorAddress?: string, status?: string) {
  return useJobs({
    creator_address: creatorAddress,
    status,
    limit: 100,
  });
}
