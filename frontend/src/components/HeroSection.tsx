"use client";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Triangle, X } from "lucide-react";
import Image from "next/image";
import { WalletConnectButton } from "@/components/WalletConnectButton";

const menuItems = [
  { name: "For Creators", href: "#" },
  { name: "For Nodes", href: "#" },
  { name: "For Admins", href: "#" },
  { name: "About", href: "#" },
];

export default function HeroSection() {
  const [menuState, setMenuState] = useState(false);
  return (
    <>
      <header>
        <nav
          data-state={menuState && "active"}
          className="fixed z-20 w-full border-b border-dashed bg-zinc-950/80 backdrop-blur md:relative dark:bg-zinc-950/50 lg:dark:bg-transparent"
        >
          <div className="m-auto max-w-5xl px-6">
            <div className="flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
              <div className="flex w-full justify-between lg:w-auto">
                <Link
                  href="/"
                  aria-label="home"
                  className="flex items-center space-x-2"
                >
                  <Triangle className="text-blue-400" />
                  <h3 className="text-lg text-slate-200">StarkRender</h3>
                </Link>

                <button
                  onClick={() => setMenuState(!menuState)}
                  aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                  className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
                >
                  <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200 text-slate-300" />
                  <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200 text-slate-300" />
                </button>
              </div>

              <div className="bg-zinc-950/90 in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-zinc-800 p-6 shadow-2xl shadow-zinc-900/40 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
                <div className="lg:pr-4">
                  <ul className="space-y-6 text-base lg:flex lg:gap-8 lg:space-y-0 lg:text-sm">
                    {menuItems.map((item, index) => (
                      <li key={index}>
                        <Link
                          href={item.href}
                          className="text-slate-400 hover:text-blue-400 block duration-150"
                        >
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit lg:border-l lg:border-zinc-700 lg:pl-6">
                  <WalletConnectButton
                    size="sm"
                    className="bg-blue-600 hover:bg-cyan-500 text-white"
                    redirectTo="/dashboard"
                  />
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main className="relative min-h-screen bg-zinc-950 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/background-image.png"
            alt="Starknet Background"
            fill
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-zinc-950/70" />
        </div>

        {/* Cosmic Gradient Overlays */}
        <div aria-hidden className="absolute inset-0 z-1 opacity-40">
          <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,rgba(74,144,226,0.3)_0,rgba(46,210,201,0.1)_50%,transparent_80%)]" />
          <div className="h-320 absolute right-0 top-0 w-60 rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(107,70,193,0.2)_0,rgba(74,144,226,0.1)_80%,transparent_100%)]" />
        </div>

        <section className="relative z-10">
          <div className="relative mx-auto max-w-5xl px-6 py-32 lg:py-40">
            <div className="relative z-10 mx-auto max-w-3xl text-center">
              <h2 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-200 via-blue-300 to-cyan-300 bg-clip-text text-transparent mb-6">
                Decentralized Work,
                <br />
                Verified Results
              </h2>
              <p className="mx-auto my-8 max-w-2xl text-lg text-slate-300 leading-relaxed">
                Where Creators post jobs, Nodes deliver excellence, and AI
                ensures quality. Join the future of verified work on Starknet.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
                <WalletConnectButton
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300 text-lg font-medium"
                  redirectTo="/dashboard"
                />
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10 px-8 py-4 rounded-xl"
                >
                  <Link href="#">
                    <span className="text-lg font-medium">Learn More</span>
                  </Link>
                </Button>
              </div>

              {/* Role Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
                <div className="bg-zinc-900/80 rounded-2xl p-6 border border-zinc-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <span className="text-xl font-bold text-white">C</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-200 mb-3">
                    For Creators
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Post jobs, manage submissions, and release rewards with
                    confidence.
                  </p>
                </div>

                <div className="bg-zinc-900/80 rounded-2xl p-6 border border-zinc-800 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <span className="text-xl font-bold text-white">W</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-200 mb-3">
                    For Nodes
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Find jobs, submit quality work, and earn rewards in crypto.
                  </p>
                </div>

                <div className="bg-zinc-900/80 rounded-2xl p-6 border border-zinc-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <span className="text-xl font-bold text-white">A</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-200 mb-3">
                    For Admins
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Oversee the ecosystem, resolve disputes, and ensure
                    fairness.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-zinc-950/90 relative z-10 py-16 border-t border-zinc-800">
          <div className="m-auto max-w-5xl flex flex-col items-center mt-16 px-6">
            <h2 className="text-center text-2xl font-medium text-slate-200">
              Built with modern technology stack.
            </h2>
            <div className="mx-auto mt-20 flex max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-8 sm:gap-x-16 sm:gap-y-12 opacity-60">
              <img
                className="h-4 w-fit brightness-0 invert opacity-60"
                src="https://html.tailus.io/blocks/customers/github.svg"
                alt="GitHub Logo"
                height="16"
                width="auto"
              />
              <img
                className="h-4 w-fit brightness-0 invert opacity-60"
                src="https://html.tailus.io/blocks/customers/tailwindcss.svg"
                alt="Tailwind CSS Logo"
                height="16"
                width="auto"
              />
              <img
                className="h-5 w-fit brightness-0 invert opacity-60"
                src="https://html.tailus.io/blocks/customers/vercel.svg"
                alt="Vercel Logo"
                height="20"
                width="auto"
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
