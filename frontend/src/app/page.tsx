export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">VeriFrame</h1>
            <p className="text-gray-600 mt-2">Decentralized Blender Rendering on StarkNet</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow">
            <span className="text-sm text-gray-500">Wallet: </span>
            <span className="text-sm font-mono">Not Connected</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Job Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Create Render Job
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blender File (.blend)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-gray-500">
                    Drag & drop your .blend file here, or click to select
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reward Amount (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                Create Job
              </button>
            </div>
          </div>

          {/* Job List Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Available Jobs
            </h2>
            
            <div className="space-y-4">
              {/* Sample Job Card */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">Job #1</h3>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    Available
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Render a 3D scene with realistic lighting
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">
                    Reward: 0.05 ETH
                  </span>
                  <span className="text-xs text-gray-500">
                    Deadline: 2h 30m
                  </span>
                </div>
              </div>

              {/* No Jobs Message */}
              <div className="text-center py-8 text-gray-500">
                <p>No rendering jobs available</p>
                <p className="text-sm mt-1">Check back later or create a new job</p>
              </div>
            </div>
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
