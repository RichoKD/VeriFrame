"use client";

import { useState } from "react";
import { useCreateJob } from "@/hooks/useJobs";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, AlertCircle, Info } from "lucide-react";

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateJobDialog({ open, onOpenChange }: CreateJobDialogProps) {
  const { user } = useAuth();
  const createJob = useCreateJob();

  const [formData, setFormData] = useState({
    chain_job_id: "",
    asset_cid_part1: "",
    asset_cid_part2: "",
    reward_amount: "",
    deadline: "",
    min_reputation: "400",
    required_capabilities: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // In production, you'd upload to IPFS here
      // For now, simulate with a placeholder CID
      setFormData((prev) => ({
        ...prev,
        asset_cid_part1: `Qm${selectedFile.name.replace(/[^a-zA-Z0-9]/g, "")}`,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.chain_job_id) {
      newErrors.chain_job_id = "Chain Job ID is required";
    } else if (isNaN(Number(formData.chain_job_id)) || Number(formData.chain_job_id) <= 0) {
      newErrors.chain_job_id = "Must be a positive number";
    }

    if (!formData.asset_cid_part1) {
      newErrors.asset_cid_part1 = "Asset CID is required (please upload a file)";
    }

    if (!formData.reward_amount) {
      newErrors.reward_amount = "Reward amount is required";
    } else if (isNaN(Number(formData.reward_amount)) || Number(formData.reward_amount) <= 0) {
      newErrors.reward_amount = "Must be a positive number";
    }

    if (!formData.deadline) {
      newErrors.deadline = "Deadline is required";
    } else {
      const deadlineDate = new Date(formData.deadline);
      if (deadlineDate <= new Date()) {
        newErrors.deadline = "Deadline must be in the future";
      }
    }

    if (!formData.min_reputation) {
      newErrors.min_reputation = "Minimum reputation is required";
    } else if (
      isNaN(Number(formData.min_reputation)) ||
      Number(formData.min_reputation) < 0 ||
      Number(formData.min_reputation) > 1000
    ) {
      newErrors.min_reputation = "Must be between 0 and 1000";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user?.address) {
      setErrors({ submit: "Please connect your wallet" });
      return;
    }

    try {
      // Convert reward to wei (multiply by 10^18)
      const rewardInWei = Math.floor(Number(formData.reward_amount) * 1e18);

      await createJob.mutateAsync({
        chain_job_id: Number(formData.chain_job_id),
        creator_address: user.address,
        asset_cid_part1: formData.asset_cid_part1,
        asset_cid_part2: formData.asset_cid_part2 || undefined,
        reward_amount: rewardInWei,
        deadline: new Date(formData.deadline).toISOString(),
        min_reputation: Number(formData.min_reputation),
        required_capabilities: formData.required_capabilities || undefined,
      });

      // Success - reset form and close dialog
      setFormData({
        chain_job_id: "",
        asset_cid_part1: "",
        asset_cid_part2: "",
        reward_amount: "",
        deadline: "",
        min_reputation: "400",
        required_capabilities: "",
      });
      setFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create job:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "Failed to create job",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Create New Job
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Post a new rendering job for nodes to complete
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Chain Job ID */}
            <div className="space-y-2">
              <Label htmlFor="chain_job_id" className="text-slate-200">
                Chain Job ID *
              </Label>
              <Input
                id="chain_job_id"
                name="chain_job_id"
                type="number"
                placeholder="1"
                value={formData.chain_job_id}
                onChange={handleInputChange}
                className="bg-slate-800 border-slate-700 text-slate-200"
              />
              {errors.chain_job_id && (
                <p className="text-sm text-red-400">{errors.chain_job_id}</p>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file" className="text-slate-200">
                Scene File * (.blend, .fbx, etc.)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".blend,.fbx,.obj,.gltf,.glb"
                  className="bg-slate-800 border-slate-700 text-slate-200 file:bg-blue-500 file:text-white file:border-0 file:px-4 file:py-2 file:rounded-md file:mr-4"
                />
              </div>
              {file && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <Upload className="w-4 h-4" />
                  {file.name}
                </div>
              )}
              {errors.asset_cid_part1 && (
                <p className="text-sm text-red-400">{errors.asset_cid_part1}</p>
              )}
              <p className="text-xs text-slate-500">
                File will be uploaded to IPFS
              </p>
            </div>

            {/* Reward Amount */}
            <div className="space-y-2">
              <Label htmlFor="reward_amount" className="text-slate-200">
                Reward Amount (ETH) *
              </Label>
              <Input
                id="reward_amount"
                name="reward_amount"
                type="number"
                step="0.001"
                placeholder="0.1"
                value={formData.reward_amount}
                onChange={handleInputChange}
                className="bg-slate-800 border-slate-700 text-slate-200"
              />
              {errors.reward_amount && (
                <p className="text-sm text-red-400">{errors.reward_amount}</p>
              )}
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-slate-200">
                Deadline *
              </Label>
              <Input
                id="deadline"
                name="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={handleInputChange}
                className="bg-slate-800 border-slate-700 text-slate-200"
              />
              {errors.deadline && (
                <p className="text-sm text-red-400">{errors.deadline}</p>
              )}
            </div>

            {/* Minimum Reputation */}
            <div className="space-y-2">
              <Label htmlFor="min_reputation" className="text-slate-200">
                Minimum Worker Reputation (0-1000)
              </Label>
              <Input
                id="min_reputation"
                name="min_reputation"
                type="number"
                min="0"
                max="1000"
                value={formData.min_reputation}
                onChange={handleInputChange}
                className="bg-slate-800 border-slate-700 text-slate-200"
              />
              {errors.min_reputation && (
                <p className="text-sm text-red-400">{errors.min_reputation}</p>
              )}
              <p className="text-xs text-slate-500">
                Only workers with this reputation or higher can accept the job
              </p>
            </div>

            {/* Required Capabilities (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="required_capabilities" className="text-slate-200">
                Required Capabilities (Optional)
              </Label>
              <Input
                id="required_capabilities"
                name="required_capabilities"
                placeholder='e.g., {"gpu": "RTX 3080", "ram": "32GB"}'
                value={formData.required_capabilities}
                onChange={handleInputChange}
                className="bg-slate-800 border-slate-700 text-slate-200"
              />
              <p className="text-xs text-slate-500">
                JSON string of required hardware/software capabilities
              </p>
            </div>

            {/* Info Alert */}
            <Alert className="bg-blue-500/10 border-blue-500/50">
              <Info className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300 text-sm">
                Make sure you have sufficient balance in escrow to cover the
                reward amount before creating the job.
              </AlertDescription>
            </Alert>
          </div>

          {/* Error Alert */}
          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createJob.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createJob.isPending}
              className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500"
            >
              {createJob.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Job"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
