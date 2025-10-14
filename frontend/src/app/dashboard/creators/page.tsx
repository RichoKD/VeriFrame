"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CreatorDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch jobs created by the current user
  const { data: jobs = [], isLoading: jobsLoading } = useMyJobs(user?.address);
  const { data: stats } = useJobStats();

  // Filter jobs based on status
  const filteredJobs = statusFilter === "all" 
    ? jobs 
    : jobs.filter(job => job.status === statusFilter);

  // Calculate user-specific stats
  const openJobs = jobs.filter(j => j.status === "open").length;
  const activeJobs = jobs.filter(j => j.status === "assigned").length;
  const completedJobs = jobs.filter(j => j.status === "completed").length;
  const totalRewards = jobs.reduce((sum, j) => sum + j.reward_amount, 0);

  return (
    <BaseLayout
      title="Creator Dashboard"
      subtitle="Manage your projects and collaborate with nodes"
      gradientVariant="blue"
      showFooter={true}
    >
      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Open Jobs</p>
                <p className="text-3xl font-bold text-blue-400">{openJobs}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-yellow-400">{activeJobs}</p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-400">{completedJobs}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Rewards</p>
                <p className="text-2xl font-bold text-purple-400">
                  {(totalRewards / 1e18).toFixed(2)} ETH
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Jobs Section */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-200 mb-2">Your Jobs</h2>
            <p className="text-slate-400">Manage and track your posted jobs</p>
          </div>

          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Job
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {["all", "open", "assigned", "completed", "failed"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? "bg-blue-500 hover:bg-blue-600" : ""}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Jobs List */}
        {jobsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 border-slate-700">
            <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              {statusFilter === "all" ? "No jobs yet" : `No ${statusFilter} jobs`}
            </h3>
            <p className="text-slate-400 mb-6">
              Get started by creating your first rendering job
            </p>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Job
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="p-6 hover:border-blue-500/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-200">
                        Job #{job.chain_job_id}
                      </h3>
                      <Badge 
                        className={
                          job.status === "open" ? "bg-blue-500/20 text-blue-400" :
                          job.status === "assigned" ? "bg-yellow-500/20 text-yellow-400" :
                          job.status === "completed" ? "bg-green-500/20 text-green-400" :
                          "bg-red-500/20 text-red-400"
                        }
                      >
                        {job.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {(job.reward_amount / 1e18).toFixed(4)} ETH
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(job.deadline).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Min Reputation: {job.min_reputation}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/creators/jobs/${job.id}`)}
                    >
                      View Details
                    </Button>
                    {job.status === "completed" && (
                      <Button 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => router.push(`/dashboard/creators/jobs/${job.id}`)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Job Dialog */}
        <CreateJobDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen} 
        />
      </div>
    </BaseLayout>
  );
}

