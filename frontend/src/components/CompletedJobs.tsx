import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

interface CompletedJob {
  job_id: number;
  result_cid: string;
  completed_at: number;
  ipfs_gateway_url: string;
}

interface CompletedJobsProps {
  refreshInterval?: number; // milliseconds
}

export const CompletedJobs: React.FC<CompletedJobsProps> = ({ 
  refreshInterval = 10000 // Default 10 seconds
}) => {
  const [jobs, setJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompletedJobs = async () => {
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
  };

  useEffect(() => {
    // Initial fetch
    fetchCompletedJobs();

    // Set up polling
    const interval = setInterval(fetchCompletedJobs, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Completed Render Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading completed jobs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Completed Render Jobs</CardTitle>
        {jobs.length > 0 && (
          <p className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No completed jobs found. Submit a render job to see results here.
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.job_id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">Job #{job.job_id}</h3>
                      <p className="text-sm text-gray-600">
                        Completed: {formatDate(job.completed_at)}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Result CID:</label>
                        <div className="flex items-center space-x-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {job.result_cid}
                          </code>
                          <button
                            onClick={() => copyToClipboard(job.result_cid)}
                            className="text-blue-500 hover:text-blue-700 text-xs"
                            title="Copy CID"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <a
                          href={job.ipfs_gateway_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Image
                        </a>
                        <button
                          onClick={() => copyToClipboard(job.ipfs_gateway_url)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Copy URL
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview image */}
                  <div className="mt-4">
                    <img
                      src={job.ipfs_gateway_url}
                      alt={`Render result for job ${job.job_id}`}
                      className="max-w-full h-auto max-h-96 object-contain rounded border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompletedJobs;
