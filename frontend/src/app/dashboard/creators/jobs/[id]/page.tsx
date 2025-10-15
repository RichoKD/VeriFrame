"use client";

import { use, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import BaseLayout from "@/components/BaseLayout";
import { useJob, useJobEvents } from "@/hooks/useJobs";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getIpfsUrl } from "@/lib/constants";
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
  Image as ImageIcon,
  FileCode,
} from "lucide-react";

export default function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
            <p className="ml-4 text-slate-300">Loading...</p>
          </div>
        </div>
      </BaseLayout>
    );
  }

  if (error || !job) {
    console.log("Error or no job found:", error);
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
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="mb-8 hover:bg-blue-500/10 hover:text-blue-400 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8" ref={ref}>
              {/* Job Header */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="p-8 border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <h1 className="text-3xl sm:text-4xl font-bold text-slate-200">
                        Job #{job.chain_job_id}
                      </h1>
                      <Badge
                        className={`text-sm px-3 py-1 ${
                          job.status === "open"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                            : job.status === "assigned"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
                            : job.status === "completed"
                            ? "bg-green-500/20 text-green-400 border border-green-500/20"
                            : "bg-red-500/20 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {job.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <DollarSign className="w-4 h-4 text-green-400" />
                        </div>
                        <p className="text-xs text-slate-400">Reward</p>
                      </div>
                      <p className="text-lg font-bold text-green-400">
                        {(job.reward_amount / 1e18).toFixed(4)} ETH
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Calendar className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-xs text-slate-400">Deadline</p>
                      </div>
                      <p className="text-lg font-bold text-slate-200">
                        {deadline.toLocaleDateString()}
                      </p>
                      {isExpired && (
                        <p className="text-xs text-red-400">Expired</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <TrendingUp className="w-4 h-4 text-purple-400" />
                        </div>
                        <p className="text-xs text-slate-400">Min Reputation</p>
                      </div>
                      <p className="text-lg font-bold text-purple-400">
                        {job.min_reputation}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-cyan-500/10">
                          <Clock className="w-4 h-4 text-cyan-400" />
                        </div>
                        <p className="text-xs text-slate-400">Created</p>
                      </div>
                      <p className="text-lg font-bold text-slate-200">
                        {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Asset Information */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="p-8 border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-center gap-2 mb-6">
                    <FileCode className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-2xl font-bold text-slate-200">
                      Asset Information
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Asset CID</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-slate-800/30 px-4 py-3 rounded-lg text-cyan-400 flex-1 overflow-x-auto font-mono">
                          {job.full_asset_cid || job.asset_cid_part1}
                        </code>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400 transition-all duration-300"
                          onClick={() => {
                            if (job.full_asset_cid) {
                              window.open(getIpfsUrl(job.full_asset_cid), '_blank');
                            }
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400 transition-all duration-300"
                          onClick={() => {
                            if (job.full_asset_cid) {
                              window.open(getIpfsUrl(job.full_asset_cid), '_blank');
                            }
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {job.required_capabilities && (
                      <div>
                        <p className="text-sm text-slate-400 mb-2">
                          Required Capabilities
                        </p>
                        <code className="text-sm bg-slate-800/30 px-4 py-3 rounded-lg text-slate-400 block overflow-x-auto font-mono">
                          {job.required_capabilities}
                        </code>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* Results (if completed) */}
              {job.status === "completed" && job.full_result_cid && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Card className="p-8 border-2 border-green-500/50 bg-gradient-to-br from-green-500/5 to-emerald-500/5 hover:border-green-500 transition-all duration-300 hover:shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-lg bg-green-500/20">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-200">
                        Completed Results
                      </h2>
                    </div>
                    <div className="space-y-6">
                      {/* Rendered Image Preview */}
                      <div>
                        <p className="text-sm text-slate-400 mb-3 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Rendered Output
                        </p>
                        <div className="group relative rounded-xl overflow-hidden bg-slate-800/30 border-2 border-slate-700 hover:border-green-500 transition-all duration-300">
                          <img
                            src={getIpfsUrl(job.full_result_cid)}
                            alt="Rendered output"
                            className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <a
                              href={getIpfsUrl(job.full_result_cid)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-slate-900/90 hover:bg-blue-500/90 p-3 rounded-lg transition-all duration-300 hover:scale-110"
                            >
                              <ExternalLink className="w-4 h-4 text-slate-200" />
                            </a>
                            <a
                              href={getIpfsUrl(job.full_result_cid)}
                              download
                              className="bg-slate-900/90 hover:bg-green-500/90 p-3 rounded-lg transition-all duration-300 hover:scale-110"
                            >
                              <Download className="w-4 h-4 text-slate-200" />
                            </a>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-slate-400 mb-2">Result CID</p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-slate-800/30 px-4 py-3 rounded-lg text-green-400 flex-1 overflow-x-auto font-mono">
                            {job.full_result_cid}
                          </code>
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600 hover:shadow-lg transition-all duration-300"
                            onClick={() => {
                              if (job.full_result_cid) {
                                window.open(getIpfsUrl(job.full_result_cid), '_blank');
                              }
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>

                      {job.quality_score !== null && (
                        <div>
                          <p className="text-sm text-slate-400 mb-2">
                            Quality Score
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-800/30 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-green-500 to-emerald-400 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${job.quality_score}%` }}
                              />
                            </div>
                            <span className="text-lg font-bold text-green-400 min-w-[60px] text-right">
                              {job.quality_score}/100
                            </span>
                          </div>
                        </div>
                      )}

                      {job.completed_at && (
                        <div className="pt-2 border-t border-slate-700">
                          <p className="text-sm text-slate-400 mb-1">
                            Completed At
                          </p>
                          <p className="text-sm font-semibold text-slate-200">
                            {new Date(job.completed_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Activity Timeline */}
              {eventsList.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Card className="p-8 border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg">
                    <h2 className="text-2xl font-bold text-slate-200 mb-6">
                      Activity Timeline
                    </h2>
                    <div className="space-y-6">
                      {eventsList.map((event: any, index: number) => (
                        <motion.div 
                          key={event.id} 
                          className="flex gap-4"
                          initial={{ opacity: 0, x: -20 }}
                          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-blue-400 rounded-full ring-4 ring-blue-400/20" />
                            {index < eventsList.length - 1 && (
                              <div className="w-px h-full bg-slate-700 mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <p className="text-sm font-semibold text-slate-200 capitalize">
                              {event.event_type.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                            {event.actor_address && (
                              <code className="text-xs text-slate-400 mt-2 block font-mono">
                                {event.actor_address.slice(0, 10)}...{event.actor_address.slice(-8)}
                              </code>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Creator Info */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="p-6 border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg">
                  <h3 className="text-lg font-bold text-slate-200 mb-4">
                    Creator
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center ring-4 ring-blue-500/20">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 mb-1">Address</p>
                      <code className="text-xs text-slate-200 break-all font-mono">
                        {job.creator_address.slice(0, 10)}...{job.creator_address.slice(-8)}
                      </code>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Worker Info (if assigned) */}
              {job.worker_id && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Card className="p-6 border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg">
                    <h3 className="text-lg font-bold text-slate-200 mb-4">
                      Assigned Worker
                    </h3>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-full flex items-center justify-center ring-4 ring-purple-500/20">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 mb-1">Worker ID</p>
                        <code className="text-xs text-slate-200 break-all font-mono">
                          {job.worker_id}
                        </code>
                      </div>
                    </div>
                    {job.assigned_at && (
                      <div className="pt-3 border-t border-slate-700">
                        <p className="text-xs text-slate-400">
                          Assigned: {new Date(job.assigned_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}

              {/* Actions */}
              {isCreator && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Card className="p-6 border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg">
                    <h3 className="text-lg font-bold text-slate-200 mb-4">
                      Actions
                    </h3>
                    <div className="space-y-3">
                      {job.status === "open" && (
                        <Button 
                          variant="outline"
                          className="w-full hover:border-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
                        >
                          Cancel Job
                        </Button>
                      )}
                      {job.status === "completed" && (
                        <>
                          <Button className="w-full bg-green-500 hover:bg-green-600 hover:shadow-lg transition-all duration-300">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Accept & Pay
                          </Button>
                          <Button 
                            variant="outline"
                            className="w-full hover:border-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject Submission
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Alert className="bg-blue-500/10 border-blue-500/50 hover:border-blue-500 transition-all duration-300">
                  <Info className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-300 text-sm leading-relaxed">
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
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
