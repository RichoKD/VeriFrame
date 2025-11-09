"use client";
import {
  Clock,
  Users,
  Briefcase,
  Shield,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const BentoGrid = () => {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background cosmic image with overlay */}
      <div className="absolute inset-0 opacity-30">
        <img
          src="/background-image.png"
          alt="Cosmic background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/60" />
      </div>

      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-6 lg:grid-cols-12">
          <div className="relative h-60 overflow-hidden rounded-3xl md:col-span-2 md:row-span-2 md:h-[400px] lg:col-span-4 lg:h-full bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
            <div className="absolute bottom-6 left-6 z-10 text-white">
              <h3 className="text-lg font-semibold">
                Decentralized Job Platform.
              </h3>
            </div>
            <div className="absolute right-6 top-6 z-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/30 backdrop-blur-sm">
                <Briefcase className="h-5 w-5 text-cyan-300" />
              </div>
            </div>
          </div>

          <div className="relative h-60 overflow-hidden rounded-3xl border border-purple-500/30 md:col-span-2 md:row-span-2 md:h-[400px] lg:col-span-4 lg:h-full bg-gradient-to-br from-purple-600/20 to-blue-600/20">
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/80 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 z-10">
              <h3 className="text-sm leading-tight md:text-base lg:text-xl text-white font-semibold">
                Secure and transparent work
              </h3>
            </div>
            <div className="absolute right-6 top-6 z-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/30 backdrop-blur-sm">
                <Shield className="h-5 w-5 text-purple-300" />
              </div>
            </div>
          </div>

          <Card className="col-span-1 rounded-3xl md:col-span-2 md:row-span-1 md:h-[192px] lg:col-span-2 bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-600/30 backdrop-blur-sm">
            <CardContent className="flex h-full flex-col justify-center p-6 md:p-8 space-y-2">
              <div className="text-4xl font-bold md:text-4xl lg:text-6xl text-cyan-300">
                95
                <span className="align-top text-2xl md:text-xl lg:text-3xl text-cyan-400">
                  %
                </span>
              </div>
              <p className="text-sm leading-tight md:text-sm text-slate-300">
                Node satisfaction rate
                <br />
                on our platform
              </p>
            </CardContent>
          </Card>

          <div className="relative col-span-1 h-60 overflow-hidden rounded-3xl border border-blue-500/30 md:col-span-2 md:row-span-1 md:h-[192px] lg:col-span-2 bg-gradient-to-br from-blue-600/20 to-slate-700/20">
            <div className="absolute inset-0 flex items-center justify-center">
              <Users className="h-16 w-16 text-blue-400 opacity-60" />
            </div>
            <div className="absolute bottom-4 left-4 z-10">
              <p className="text-sm text-blue-300 font-medium">
                Active Community
              </p>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm col-span-1 rounded-3xl md:col-span-4 md:row-span-1 md:h-[300px] lg:col-span-4 border border-slate-600/30">
            <CardContent className="h-full p-6 md:p-8">
              <div className="flex h-full flex-col justify-end space-y-6">
                <div className="text-4xl font-normal md:text-5xl lg:text-6xl text-cyan-300">
                  $0
                </div>
                <div className="text-slate-400 text-sm md:text-base">
                  Platform fee for creators
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-none h-12 px-8 rounded-lg transition-all duration-200">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl md:col-span-2 md:row-span-1 md:h-[300px] lg:col-span-3 border border-slate-600/30">
            <CardContent className="flex h-full flex-col justify-center p-6 md:p-8 space-y-6">
              <div>
                <span className="text-4xl font-bold md:text-3xl lg:text-6xl text-cyan-300">
                  1K
                </span>
                <span className="align-top text-2xl font-bold md:text-xl lg:text-3xl text-cyan-400">
                  +
                </span>
              </div>
              <p className="text-sm md:text-sm text-slate-400">
                Active nodes worldwide
              </p>
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Avatar
                    key={i}
                    className="border-slate-600 h-8 w-8 border-2 md:h-8 md:w-8 lg:h-10 lg:w-10"
                  >
                    <AvatarImage src={`/images/block/avatar-${i + 1}.webp`} />
                    <AvatarFallback className="bg-slate-700 text-slate-300">
                      W{i}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="relative col-span-1 h-60 overflow-hidden rounded-3xl md:col-span-3 md:row-span-1 md:h-[300px] lg:col-span-5 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-slate-900/30 to-transparent" />
            <div className="absolute inset-0 z-10 flex items-center justify-start p-4 md:p-6">
              <div className="text-white">
                <div className="mb-2 flex items-center gap-2 md:gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/30 backdrop-blur-sm md:h-7 md:w-7">
                    <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-purple-300" />
                  </div>
                  <span className="text-base md:text-lg font-semibold">
                    Verified Submissions
                  </span>
                </div>
                <p className="text-sm opacity-90 md:text-sm text-slate-300">
                  AI-powered analysis for
                  <br />
                  <span className="text-sm font-semibold md:text-sm text-purple-300">
                    quality assurance
                  </span>
                </p>
              </div>
            </div>
          </Card>

          <Card className="relative col-span-1 h-60 overflow-hidden rounded-3xl md:col-span-3 md:row-span-1 md:h-[300px] lg:col-span-4 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-slate-900/30 to-transparent" />
            <div className="absolute inset-0 z-10 flex items-center justify-start p-4 md:p-6">
              <div className="text-white">
                <div className="mb-2 flex items-center gap-2 md:gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/30 backdrop-blur-sm md:h-7 md:w-7">
                    <Clock className="h-3 w-3 md:h-4 md:w-4 text-cyan-300" />
                  </div>
                  <span className="text-base md:text-lg font-semibold">
                    Real-time Tracking
                  </span>
                </div>
                <p className="text-sm opacity-90 md:text-sm text-slate-300">
                  Monitor job progress with
                  <br />
                  <span className="text-sm font-semibold md:text-sm text-cyan-300">
                    blockchain transparency
                  </span>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export { BentoGrid };
