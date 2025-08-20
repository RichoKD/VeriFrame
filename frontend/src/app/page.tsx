"use client";

import { ConnectButton } from "@/components/ConnectButton";
import { JobCreationForm } from "@/components/JobCreationForm";
import CompletedJobs from "@/components/CompletedJobs";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">VeriFrame</h1>
            <p className="text-gray-600 mt-2">Decentralized Blender Rendering on StarkNet</p>
            <ConnectButton />

          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Job Section */}
          <JobCreationForm />
          {/* Completed Jobs Section */}
          <div className="mt-8">
            <CompletedJobs refreshInterval={5000} />
          </div>

        </div>

        

        {/* Stats Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900">Total Jobs</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900">Active Workers</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900">Total Rewards</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">0 ETH</p>
          </div>
        </div>
      </div>
    </main>
  );
}
