"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Settings, LogOut } from "lucide-react";

interface DashboardHeaderProps {
  role?: "creator" | "node" | "admin";
}

export function DashboardHeader({ role = "creator" }: DashboardHeaderProps) {
  // Get dashboard title based on role
  const dashboardTitles = {
    creator: "Creator Dashboard",
    node: "Node Dashboard",
    admin: "Admin Dashboard",
  };

  // Gradient colors based on role
  const gradientColors = {
    creator: "from-blue-400 to-cyan-400",
    node: "from-cyan-400 to-purple-400",
    admin: "from-purple-400 to-pink-400",
  };

  const title = dashboardTitles[role];
  const gradient = gradientColors[role];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <Image
              src="/logo.png"
              alt="StarkRender Logo"
              width={140}
              height={50}
              className="h-8 w-auto transition-all duration-300 group-hover:scale-105"
              priority
            />
          </Link>

          {/* Centered Dashboard Title */}
          <div className="hidden md:flex flex-1 justify-center">
            <h1 className={`text-base font-semibold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
              {title}
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex border-slate-700 text-slate-300 hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400 transition-all duration-300"
            >
              <Settings className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-300"
            >
              <Link href="/">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Exit</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Title */}
        <div className="md:hidden pb-1.5 border-t border-zinc-800 mt-1.5 pt-1.5">
          <h1 className={`text-sm font-semibold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
            {title}
          </h1>
        </div>
      </nav>
    </header>
  );
}
