"use client";

import { useState, useEffect } from "react";
import { useAccount, useContract, useSendTransaction } from "@starknet-react/core";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDropzone } from "react-dropzone";

interface JobFormData {
  blendFile: File | null;
  reward: string;
  deadline: string;
  description: string;
}

// Simple IPFS upload function using fetch
async function uploadToIPFS(file: File, apiUrl: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${apiUrl}/api/v0/add?pin=true`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`IPFS upload failed: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.Hash;
}

export function JobCreationForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { register, handleSubmit, setValue, watch } = useForm<JobFormData>();
  const { address } = useAccount();
  const contractAddress = (process.env.NEXT_PUBLIC_JOB_REGISTRY_ADDRESS || "0x1234") as `0x${string}`;
  
  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);
  // Replace with your actual ABI
  const CONTRACT_ABI = [
        {
            "type": "function",
            "name": "get_job_creator",
            "inputs": [{"name": "job_id", "type": "core::felt252"}],
            "outputs": [{"type": "core::felt252"}],
            "state_mutability": "view",
        },
        {
            "type": "function", 
            "name": "get_job_worker",
            "inputs": [{"name": "job_id", "type": "core::felt252"}],
            "outputs": [{"type": "core::felt252"}],
            "state_mutability": "view",
        },
        {
            "type": "function",
            "name": "get_job_reward", 
            "inputs": [{"name": "job_id", "type": "core::felt252"}],
            "outputs": [{"type": "core::integer::u256"}],
            "state_mutability": "view",
        },
        {
            "type": "function",
            "name": "get_job_asset_cid",
            "inputs": [{"name": "job_id", "type": "core::felt252"}],
            "outputs": [{"type": "core::felt252"}, {"type": "core::felt252"}],
            "state_mutability": "view",
        },
        {
            "type": "function",
            "name": "create_job",
            "inputs": [
                {"name": "asset_cid_part1", "type": "core::felt252"},
                {"name": "asset_cid_part2", "type": "core::felt252"},
                {"name": "reward_amount", "type": "core::integer::u256"},
                {"name": "deadline_timestamp", "type": "core::integer::u64"}
            ],
            "outputs": [],
            "state_mutability": "external",
        },
        {
            "type": "function",
            "name": "submit_result",
            "inputs": [
                {"name": "job_id", "type": "core::felt252"},
                {"name": "result_cid", "type": "core::felt252"}
            ],
            "outputs": [],
            "state_mutability": "external",
        },
    ] as const;

  const { contract } = useContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
  });
  const { sendAsync: write, isPending } = useSendTransaction({});

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/octet-stream": [".blend"],
    },
    maxFiles: 1,
    onDrop: (files) => {
      if (files[0]) {
        setValue("blendFile", files[0]);
      }
    },
  });

  const onSubmit = async (data: JobFormData) => {
    if (!data.blendFile) return;
    setIsUploading(true);
    setIpfsHash(null);
    setTxHash(null);
    try {
      // Upload file to IPFS using fetch
      const ipfsApiUrl = process.env.NEXT_PUBLIC_IPFS_API || "http://localhost:5001";
      const ipfsHash = await uploadToIPFS(data.blendFile, ipfsApiUrl);
      setIpfsHash(ipfsHash);

      // Interact with contract using IPFS hash
      // Convert values to proper types for StarkNet
      // Split IPFS CID into two parts to fit in felt252 fields (31 chars each)
      const part1 = ipfsHash.substring(0, 31);
      const part2 = ipfsHash.substring(31);
      
      console.log('Original IPFS CID:', ipfsHash);
      console.log('Part 1:', part1);
      console.log('Part 2:', part2);
      const rewardFelt = BigInt(Math.floor(parseFloat(data.reward) * 1e18)); // Convert STRK to wei
      const deadlineFelt = BigInt(Date.parse(data.deadline));
      const descriptionFelt = data.description || "";

      if (!contract) {
        throw new Error("Contract not initialized");
      }

      const call = contract.populate("create_job", [part1, part2, rewardFelt, deadlineFelt]);
      const tx = await write([call]);
      setTxHash(tx?.transaction_hash || null);
    } catch (error) {
      console.error("IPFS/Contract error:", error);
      setIpfsHash(null);
      setTxHash(null);
    } finally {
      setIsUploading(false);
    }
  };

  const selectedFile = watch("blendFile");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Rendering Job</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* File Upload */}
          <div>
            <Label>Blender File (.blend)</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              {selectedFile ? (
                <p className="text-green-600">Selected: {selectedFile.name}</p>
              ) : (
                <p className="text-gray-500">Drag & drop a .blend file here, or click to select</p>
              )}
            </div>
          </div>

          {/* Reward Amount */}
          <div>
            <Label htmlFor="reward">Reward (STRK)</Label>
            <Input
              id="reward"
              type="number"
              step="0.01"
              placeholder="0.01"
              {...register("reward", { required: true })}
            />
          </div>

          {/* Deadline */}
          <div>
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              {...register("deadline", { required: true })}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="Render settings, special requirements..."
              {...register("description")}
            />
          </div>

          <Button type="submit" disabled={isUploading || !selectedFile || isPending || !isClient} className="w-full">
            {!isClient ? "Loading..." : isUploading ? "Uploading to IPFS & Contract..." : "Create Job"}
          </Button>
          {ipfsHash && (
            <div className="mt-2 text-sm text-blue-600">
              Uploaded to IPFS: <a href={`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}${ipfsHash}`} target="_blank" rel="noopener noreferrer">{ipfsHash}</a>
            </div>
          )}
          {txHash && (
            <div className="mt-2 text-sm text-green-600">
              Job submitted to contract! Tx: {txHash}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
