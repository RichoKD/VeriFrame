# VeriFrame Frontend

A Next.js-based web application for the VeriFrame decentralized Blender rendering platform.

## 🎯 Overview

VeriFrame Frontend provides a user-friendly interface for:
- **Job Creators**: Upload .blend files and create rendering jobs
- **Workers**: Browse and claim available rendering jobs
- **Users**: Track job status and view completed renders

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Web3**: StarkNet.js + @starknet-react (configured but not yet integrated)
- **UI Components**: Shadcn/ui (partially set up)
- **State Management**: Zustand (installed, ready to use)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📁 Current Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main landing page
│   └── globals.css         # Global styles
├── components/
│   └── ui/                 # Shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── label.tsx
└── lib/
    └── utils.ts            # Utility functions
```

## 🎨 Current Features

### ✅ **Implemented**
- **Landing Page**: Clean, professional design
- **Job Creation Form**: UI for uploading .blend files and setting rewards
- **Job Listing**: Display available rendering jobs
- **Stats Dashboard**: Show platform metrics
- **Responsive Design**: Works on desktop and mobile
- **Component System**: Reusable UI components with Tailwind

### 🔄 **In Progress**
- **Web3 Integration**: StarkNet wallet connection
- **File Upload**: IPFS integration for .blend files
- **Real-time Updates**: Job status tracking
- **Contract Integration**: Connect to job registry smart contract

### 📋 **Planned**
- **User Dashboard**: Personal job history and earnings
- **Worker Interface**: Claim and manage rendering jobs
- **Result Gallery**: View and download rendered images
- **Payment System**: Handle rewards and transactions
- **Notifications**: Real-time job status updates

## 🔧 Configuration

### Environment Variables
Create `.env.local`:
```bash
NEXT_PUBLIC_STARKNET_RPC=http://localhost:5050
NEXT_PUBLIC_JOB_REGISTRY_ADDRESS=0x1234567890abcdef
NEXT_PUBLIC_IPFS_GATEWAY=http://localhost:8080/ipfs/
NEXT_PUBLIC_IPFS_API=http://localhost:5001
```

### Dependencies Status
```bash
✅ Core framework (Next.js, TypeScript, Tailwind)
✅ UI components (partially set up)
⚠️  Web3 integration (installed, needs configuration)
⚠️  IPFS client (installed, needs implementation)
⚠️  Form handling (installed, needs implementation)
```

## 🚧 Known Issues

1. **React Version Conflict**: StarkNet React hooks require React 18, but Next.js 15 uses React 19
   - **Workaround**: Using `--legacy-peer-deps` flag
   - **Solution**: Wait for @starknet-react updates or downgrade Next.js

2. **Shadcn/ui Setup**: Some components need manual installation due to peer dependency conflicts

## 🔮 Next Steps

### Phase 1: Core Functionality
1. **File Upload Component**: Implement drag-and-drop .blend file upload
2. **IPFS Integration**: Connect to IPFS for decentralized file storage
3. **Form Handling**: Add validation and submission logic
4. **Contract Connection**: Integrate with job registry smart contract

### Phase 2: Web3 Integration
1. **Wallet Connection**: Enable StarkNet wallet connection (ArgentX, Braavos)
2. **Transaction Handling**: Submit jobs and handle payments
3. **Event Listening**: Real-time job status updates from blockchain
4. **Account Management**: User profiles and transaction history

### Phase 3: Enhanced UX
1. **Job Dashboard**: Comprehensive job management interface
2. **Result Viewer**: Display and download rendered images
3. **Progress Tracking**: Real-time rendering progress
4. **Mobile App**: React Native version for mobile access

## 🎨 Design System

The frontend uses a clean, modern design with:
- **Colors**: Blue gradient background, white cards, professional palette
- **Typography**: Inter font for readability
- **Layout**: Responsive grid system
- **Components**: Consistent spacing and styling
- **Accessibility**: ARIA labels and keyboard navigation

## 🔗 Integration Points

- **Smart Contract**: Job creation, status updates, payments
- **IPFS**: File storage for .blend files and rendered results
- **Worker Nodes**: Job assignment and result submission
- **Notifications**: Real-time updates via WebSocket or polling

This frontend provides a solid foundation for the VeriFrame platform and is ready for Web3 integration!
