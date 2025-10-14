"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import BaseLayout from "@/components/BaseLayout";
import { useJob, useJobEvents } from "@/hooks/useJobs";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
  Info,
  User,
} from "lucide-react";

export default function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const { data: job, isLoading, error } = useJob(resolvedParams.id);
  const { data: events = [] } = useJobEvents(resolvedParams.id);
  const eventsList = Array.isArray(events) ? events : [];

  if (isLoading) {
    return (
      <BaseLayout
        title="Job Details"
        subtitle="Loading job information..."
        gradientVariant="blue"
        showFooter={true}
      >
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
          </div>
        </div>
      </BaseLayout>
    );
  }

  if (error || !job) {
    return (
      <BaseLayout
        title="Job Not Found"
        subtitle="The job you're looking for doesn't exist"
        gradientVariant="blue"
        showFooter={true}
      >
        <div className="container mx-auto px-6 py-8">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : "Job not found"}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </BaseLayout>
    );
  }

  const isCreator = user?.address === job.creator_address;
  const deadline = new Date(job.deadline);
  const isExpired = deadline < new Date();

  return (
    <BaseLayout
      title={`Job #${job.chain_job_id}`}
      subtitle="View job details and manage submissions"
      gradientVariant="blue"
      showFooter={true}
    >
      <div className="container mx-auto px-6 py-8">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-slate-200">
                    Job #{job.chain_job_id}
                  </h1>
                  <Badge
                    className={
                      job.status === "open"
                        ? "bg-blue-500/20 text-blue-400"
                        : job.status === "assigned"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : job.status === "completed"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }
                  >
                    {job.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Reward</p>
                  <div className="flex items-center gap-1 text-lg font-bold text-green-400">
                    <DollarSign className="w-4 h-4" />
                    {(job.reward_amount / 1e18).toFixed(4)} ETH
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-1">Deadline</p>
                  <div className="flex items-center gap-1 text-lg font-bold text-slate-200">
                    <Calendar className="w-4 h-4" />
                    {deadline.toLocaleDateString()}
                  </div>
                  {isExpired && (
                    <p className="text-xs text-red-400 mt-1">Expired</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-1">Min Reputation</p>
                  <div className="flex items-center gap-1 text-lg font-bold text-blue-400">
                    <TrendingUp className="w-4 h-4" />
                    {job.min_reputation}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-1">Created</p>
                  <div className="flex items-center gap-1 text-lg font-bold text-slate-200">
                    <Clock className="w-4 h-4" />
                    {new Date(job.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Card>

            {/* Asset Information */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-slate-200 mb-4">
                Asset Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Asset CID</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-slate-800 px-3 py-2 rounded text-cyan-400 flex-1 overflow-x-auto">
                      {job.full_asset_cid || job.asset_cid_part1}
                    </code>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {job.required_capabilities && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">
                      Required Capabilities
                    </p>
                    <code className="text-sm bg-slate-800 px-3 py-2 rounded text-slate-300 block overflow-x-auto">
                      {job.required_capabilities}
                    </code>
                  </div>
                )}
              </div>
            </Card>

            {/* Results (if completed) */}
            {job.status === "completed" && job.full_result_cid && (
              <Card className="p-6 border-green-500/50">
                <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Completed Results
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Result CID</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-slate-800 px-3 py-2 rounded text-green-400 flex-1 overflow-x-auto">
                        {job.full_result_cid}
                      </code>
                      <Button size="sm" className="bg-green-500 hover:bg-green-600">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>

                  {job.quality_score !== null && (
                    <div>
                      <p className="text-sm text-slate-400 mb-1">
                        Quality Score
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full"
                            style={{ width: `${job.quality_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-green-400">
                          {job.quality_score}/100
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Activity Timeline */}
            {eventsList.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-slate-200 mb-4">
                  Activity Timeline
                </h2>
                <div className="space-y-4">
                  {eventsList.map((event: any, index: number) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                        {index < eventsList.length - 1 && (
                          <div className="w-px h-full bg-slate-700 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium text-slate-200">
                          {event.event_type}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                        {event.actor_address && (
                          <p className="text-xs text-slate-500 mt-1">
                            By: {event.actor_address.slice(0, 10)}...
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Creator Info */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-200 mb-4">
                Creator
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-400">Address</p>
                  <code className="text-xs text-slate-200 break-all">
                    {job.creator_address}
                  </code>
                </div>
              </div>
            </Card>

            {/* Worker Info (if assigned) */}
            {job.worker_id && (
              <Card className="p-6">
                <h3 className="text-lg font-bold text-slate-200 mb-4">
                  Assigned Worker
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-400">Worker ID</p>
                    <code className="text-xs text-slate-200 break-all">
                      {job.worker_id}
                    </code>
                  </div>
                </div>
                {job.assigned_at && (
                  <p className="text-xs text-slate-500 mt-3">
                    Assigned: {new Date(job.assigned_at).toLocaleString()}
                  </p>
                )}
              </Card>
            )}

            {/* Actions */}
            {isCreator && (
              <Card className="p-6">
                <h3 className="text-lg font-bold text-slate-200 mb-4">
                  Actions
                </h3>
                <div className="space-y-2">
                  {job.status === "open" && (
                    <Button className="w-full" variant="outline">
                      Cancel Job
                    </Button>
                  )}
                  {job.status === "completed" && (
                    <>
                      <Button className="w-full bg-green-500 hover:bg-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept & Pay
                      </Button>
                      <Button className="w-full" variant="destructive">
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Submission
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            )}

            {/* Info Card */}
            <Alert className="bg-blue-500/10 border-blue-500/50">
              <Info className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300 text-sm">
                {job.status === "open" &&
                  "This job is waiting for a worker to accept it."}
                {job.status === "assigned" &&
                  "A worker is currently working on this job."}
                {job.status === "completed" &&
                  "This job has been completed and is awaiting review."}
                {job.status === "failed" &&
                  "This job has failed. You may need to re-post it."}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
