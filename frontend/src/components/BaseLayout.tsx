"use client";

import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Triangle, Settings, LogOut } from "lucide-react";
import { FooterSection } from "@/components/Footer";

interface BaseLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
  showBackground?: boolean;
  showFooter?: boolean;
  gradientVariant?: "blue" | "cyan" | "purple" | "green";
}

export default function BaseLayout({
  children,
  title,
  subtitle,
  headerActions,
  showBackground = true,
  showFooter = true,
  gradientVariant = "blue",
}: BaseLayoutProps) {
  // Gradient color configurations based on role/page type
  const gradientColors = {
    blue: {
      title: "from-blue-400 to-cyan-400",
      bg1: "bg-blue-500/30",
      bg2: "bg-cyan-500/20",
    },
    cyan: {
      title: "from-cyan-400 to-purple-400",
      bg1: "bg-cyan-500/30",
      bg2: "bg-purple-500/20",
    },
    purple: {
      title: "from-purple-400 to-blue-400",
      bg1: "bg-purple-500/30",
      bg2: "bg-blue-500/20",
    },
    green: {
      title: "from-green-400 to-cyan-400",
      bg1: "bg-green-500/30",
      bg2: "bg-cyan-500/20",
    },
  };

  const colors = gradientColors[gradientVariant];

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Background Layer */}
      {showBackground && (
        <>
          {/* Background Image with Overlay */}
          <div className="fixed inset-0 z-0">
            <Image
              src="/background-image.png"
              alt="Background"
              fill
              className="object-cover opacity-60"
              priority
            />
            <div className="absolute inset-0 bg-zinc-950/70" />
          </div>

          {/* Cosmic Gradient Overlays */}
          <div aria-hidden className="fixed inset-0 z-0 opacity-40">
            <div
              className={`w-96 h-96 absolute top-0 right-1/4 rounded-full blur-3xl ${colors.bg1}`}
            />
            <div
              className={`w-96 h-96 absolute bottom-1/4 left-1/4 rounded-full blur-3xl ${colors.bg2}`}
            />
          </div>
        </>
      )}

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <Triangle className="text-blue-400 w-6 h-6" />
              <h3 className="text-lg text-slate-200 font-semibold">
                StarkRender
              </h3>
            </Link>

            {/* Title Section (optional) */}
            {title && (
              <div className="hidden md:block flex-1 px-8">
                <h1
                  className={`text-2xl font-bold bg-gradient-to-r ${colors.title} bg-clip-text text-transparent`}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
                )}
              </div>
            )}

            {/* Header Actions */}
            <div className="flex items-center gap-4">
              {headerActions ? (
                headerActions
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-slate-300 hover:bg-zinc-800"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-slate-300"
                  >
                    <Link href="/">
                      <LogOut className="w-4 h-4 mr-2" />
                      Exit
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Title */}
          {title && (
            <div className="md:hidden mt-4">
              <h1
                className={`text-xl font-bold bg-gradient-to-r ${colors.title} bg-clip-text text-transparent`}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1">{children}</main>

      {/* Footer */}
      {showFooter && (
        <footer className="relative z-10 mt-auto">
          <FooterSection />
        </footer>
      )}
    </div>
  );
}
