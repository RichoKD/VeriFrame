# Quick Start Guide: VeriFrame Frontend

## 1. Initialize the Project

```bash
cd /home/rico/cairo/VeriFrame
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir
cd frontend
```

## 2. Install Dependencies

```bash
# Core Web3 packages
npm install starknet get-starknet @starknet-react/core @starknet-react/chains

# State management & data fetching
npm install zustand @tanstack/react-query

# Forms & validation
npm install react-hook-form @hookform/resolvers zod

# File handling & IPFS
npm install react-dropzone ipfs-http-client

# UI components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card form input label textarea select
npx shadcn-ui@latest add dropdown-menu dialog badge progress

# Additional utilities
npm install date-fns lucide-react framer-motion
npm install @types/node --save-dev
```

## 3. Environment Setup

```bash
# .env.local
NEXT_PUBLIC_STARKNET_RPC=http://localhost:5050
NEXT_PUBLIC_JOB_REGISTRY_ADDRESS=0x1234...
NEXT_PUBLIC_IPFS_GATEWAY=http://localhost:8080/ipfs/
NEXT_PUBLIC_IPFS_API=http://localhost:5001
```

## 4. Core Configuration Files

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'ipfs.io'],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

## 5. First Component: Job Creation

### src/app/layout.tsx
```typescript
'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { StarknetConfig, publicProvider } from '@starknet-react/core';
import { mainnet, goerli } from '@starknet-react/chains';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StarknetConfig
          chains={[mainnet, goerli]}
          provider={publicProvider()}
        >
          {children}
        </StarknetConfig>
      </body>
    </html>
  );
}
```

### src/app/page.tsx
```typescript
'use client';

import { ConnectButton } from '@/components/ConnectButton';
import { JobCreationForm } from '@/components/JobCreationForm';
import { JobList } from '@/components/JobList';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            VeriFrame
          </h1>
          <ConnectButton />
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Create Render Job</h2>
            <JobCreationForm />
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Available Jobs</h2>
            <JobList />
          </div>
        </div>
      </div>
    </main>
  );
}
```

## 6. Key Components

### src/components/ConnectButton.tsx
```typescript
'use client';

import { useConnect, useDisconnect, useAccount } from '@starknet-react/core';
import { Button } from '@/components/ui/button';

export function ConnectButton() {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <Button onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => connect({ connector: connectors[0] })}>
      Connect Wallet
    </Button>
  );
}
```

### src/components/JobCreationForm.tsx
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDropzone } from 'react-dropzone';

interface JobFormData {
  blendFile: File | null;
  reward: string;
  deadline: string;
  description: string;
}

export function JobCreationForm() {
  const [isUploading, setIsUploading] = useState(false);
  const { register, handleSubmit, setValue, watch } = useForm<JobFormData>();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/octet-stream': ['.blend'],
    },
    maxFiles: 1,
    onDrop: (files) => {
      if (files[0]) {
        setValue('blendFile', files[0]);
      }
    },
  });

  const onSubmit = async (data: JobFormData) => {
    if (!data.blendFile) return;

    try {
      setIsUploading(true);
      
      // TODO: Upload to IPFS
      console.log('Uploading:', data);
      
      // TODO: Create contract transaction
      
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const selectedFile = watch('blendFile');

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
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              {selectedFile ? (
                <p className="text-green-600">
                  Selected: {selectedFile.name}
                </p>
              ) : (
                <p className="text-gray-500">
                  Drag & drop a .blend file here, or click to select
                </p>
              )}
            </div>
          </div>

          {/* Reward Amount */}
          <div>
            <Label htmlFor="reward">Reward (ETH)</Label>
            <Input
              id="reward"
              type="number"
              step="0.001"
              placeholder="0.01"
              {...register('reward', { required: true })}
            />
          </div>

          {/* Deadline */}
          <div>
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              {...register('deadline', { required: true })}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="Render settings, special requirements..."
              {...register('description')}
            />
          </div>

          <Button 
            type="submit" 
            disabled={isUploading || !selectedFile}
            className="w-full"
          >
            {isUploading ? 'Creating Job...' : 'Create Job'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

## 7. Run the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your frontend!

## Next Steps

1. **Add IPFS Integration**: Implement actual file upload to IPFS
2. **Contract Integration**: Connect to your job registry contract
3. **Job Display**: Show real jobs from the contract
4. **Real-time Updates**: Add WebSocket or polling for job status
5. **Result Viewing**: Display rendered images from IPFS
6. **User Dashboard**: Track user's jobs and earnings

This gives you a solid foundation that matches your worker implementation!
