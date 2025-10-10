"use client";

import BaseLayout from "@/components/BaseLayout";

export default function CreatorDashboard() {
  // Add your state, logic, and data fetching here

  return (
    <BaseLayout
      title="Creator Dashboard"
      subtitle="Manage your projects and collaborate with nodes"
      gradientVariant="blue"
      showFooter={true}
    >
      {/* Add your page content here */}
      <div className="container mx-auto px-6 py-8">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-200 mb-4">
              Your Creator Dashboard
            </h2>
            <p className="text-slate-400">Start building your content here</p>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
