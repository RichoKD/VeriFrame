"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import BaseLayout from "@/components/BaseLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useMyJobs, useJobStats } from "@/hooks/useJobs";
import { CreateJobDialog } from "@/components/CreateJobDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Briefcase,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CreatorDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Fetch jobs created by the current user
  const { data: jobs = [], isLoading: jobsLoading } = useMyJobs(user?.address);
  const { data: stats } = useJobStats();

  // Filter jobs based on status
  const filteredJobs =
    statusFilter === "all"
      ? jobs
      : jobs.filter((job) => job.status === statusFilter);

  // Calculate user-specific stats
  const openJobs = jobs.filter((j) => j.status === "open").length;
  const activeJobs = jobs.filter((j) => j.status === "assigned").length;
  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const totalRewards = jobs.reduce((sum, j) => sum + j.reward_amount, 0);

  const statCards = [
    {
      label: "Open Jobs",
      value: openJobs,
      icon: Briefcase,
      gradient: "from-blue-500/10 to-cyan-500/10",
      border: "border-blue-500/20",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      valueColor: "text-blue-400",
    },
    {
      label: "In Progress",
      value: activeJobs,
      icon: Clock,
      gradient: "from-yellow-500/10 to-orange-500/10",
      border: "border-yellow-500/20",
      iconBg: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
      valueColor: "text-yellow-400",
    },
    {
      label: "Completed",
      value: completedJobs,
      icon: CheckCircle,
      gradient: "from-green-500/10 to-emerald-500/10",
      border: "border-green-500/20",
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
      valueColor: "text-green-400",
    },
    {
      label: "Total Rewards",
      value: `${(totalRewards / 1e18).toFixed(2)} ETH`,
      icon: DollarSign,
      gradient: "from-purple-500/10 to-pink-500/10",
      border: "border-purple-500/20",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
      valueColor: "text-purple-400",
    },
  ];

  return (
    <BaseLayout
      gradientVariant="blue"
      showFooter={true}
      useDashboardHeader={true}
      dashboardRole="creator"
    >
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 sm:mb-14 lg:mb-16 max-w-4xl mx-auto"
          >
            <h1 className="heading-1 text-3xl sm:text-4xl lg:text-5xl xl:text-6xl mb-4 sm:mb-6">
              Your Creative Workspace
            </h1>
            <p className="lead-text text-base sm:text-lg text-slate-300 leading-relaxed mb-6 sm:mb-8 max-w-2xl">
              Manage your rendering jobs, track progress, and collaborate with
              our network of powerful nodes
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size="lg"
              className="group w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-300 text-base sm:text-base"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Job
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-14 sm:mb-16 lg:mb-20 max-w-7xl mx-auto"
          >
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={
                  isInView
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.9 }
                }
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <Card
                  className={`p-5 sm:p-6 bg-gradient-to-br ${stat.gradient} ${stat.border} border hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group h-full`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="small-text text-slate-400 mb-1 sm:mb-2">
                        {stat.label}
                      </p>
                      <p
                        className={`text-2xl sm:text-3xl font-bold ${stat.valueColor} truncate`}
                      >
                        {typeof stat.value === "number"
                          ? stat.value
                          : stat.value}
                      </p>
                    </div>
                    <div
                      className={`p-2 sm:p-3 ${stat.iconBg} rounded-lg group-hover:scale-110 transition-transform duration-300 shrink-0 ml-3`}
                    >
                      <stat.icon
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.iconColor}`}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Jobs Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8 sm:mb-10 lg:mb-12"
          >
            <div className="mb-6 sm:mb-8 lg:mb-10 max-w-3xl mx-auto">
              <h2 className="heading-2 text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3">
                Your Jobs
              </h2>
              <p className="lead-text text-slate-300 text-base sm:text-base">
                Track and manage all your rendering jobs in one place
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
              {["all", "open", "assigned", "completed", "failed"].map(
                (status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    onClick={() => setStatusFilter(status)}
                    className={`text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2 transition-all duration-300 ${
                      statusFilter === status
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : "hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                )
              )}
            </div>
          </motion.div>

          {/* Jobs List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            {jobsLoading ? (
              <div className="flex items-center justify-center py-16 sm:py-20 lg:py-24">
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-blue-400" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <Card className="p-8 sm:p-12 text-center border-dashed border-2 border-slate-700 hover:border-blue-500 transition-all duration-300">
                <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-4 opacity-50" />
                <h3 className="heading-3 text-lg sm:text-xl lg:text-2xl font-bold text-slate-200 mb-2 sm:mb-3">
                  {statusFilter === "all"
                    ? "No jobs yet"
                    : `No ${statusFilter} jobs`}
                </h3>
                <p className="lead-text text-slate-300 leading-relaxed mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
                  Get started by creating your first rendering job and let our
                  network handle the heavy lifting
                </p>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  size="lg"
                  className="group w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Job
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6">
                {filteredJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={
                      isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                    }
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="group p-5 sm:p-6 border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-6">
                        <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <h3 className="heading-4 text-lg sm:text-xl font-bold text-slate-200 break-words">
                              Job #{job.chain_job_id}
                            </h3>
                            <Badge
                              className={`shrink-0 text-xs sm:text-sm ${
                                job.status === "open"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                                  : ""
                              }
                              ${
                                job.status === "assigned"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
                                  : ""
                              }
                              ${
                                job.status === "completed"
                                  ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                  : ""
                              }
                              ${
                                job.status === "failed"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/20"
                                  : ""
                              }`}
                            >
                              {job.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10 shrink-0">
                                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="xs-text text-slate-400 truncate">
                                  Reward
                                </p>
                                <p className="font-semibold text-slate-200 truncate">
                                  {(job.reward_amount / 1e18).toFixed(4)} ETH
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10 shrink-0">
                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="xs-text text-slate-400 truncate">
                                  Deadline
                                </p>
                                <p className="font-semibold text-slate-200 text-xs sm:text-sm truncate">
                                  {new Date(job.deadline).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/10 shrink-0">
                                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="xs-text text-slate-400 truncate">
                                  Min Rep
                                </p>
                                <p className="font-semibold text-slate-200 truncate">
                                  {job.min_reputation}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 sm:gap-3 w-full lg:w-auto lg:flex-nowrap lg:justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/creators/jobs/${job.id}`)
                            }
                            className="flex-1 lg:flex-none text-xs sm:text-sm hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400 transition-all duration-300"
                          >
                            Details
                            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 hidden sm:inline" />
                          </Button>
                          {job.status === "completed" && (
                            <Button
                              size="sm"
                              className="flex-1 lg:flex-none text-xs sm:text-sm bg-green-500 hover:bg-green-600 hover:shadow-lg transition-all duration-300"
                              onClick={() =>
                                router.push(
                                  `/dashboard/creators/jobs/${job.id}`
                                )
                              }
                            >
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Create Job Dialog */}
          <CreateJobDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
          />
        </div>
      </div>
    </BaseLayout>
  );
}
