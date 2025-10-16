"use client";

import {
  ArrowRight,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalletConnectButton } from "@/components/WalletConnectButton";

const navigation = [
  {
    title: "Platform",
    links: [
      { name: "Nodes", href: "#" },
      { name: "Creators", href: "#" },
      { name: "Admins", href: "#" },
      { name: "Browse Jobs", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "#" },
      { name: "Pricing", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { name: "FAQ", href: "#" },
      { name: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Terms of service", href: "#" },
      { name: "Privacy policy", href: "#" },
    ],
  },
];

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
];

const FooterSection = () => {
  return (
    <section className="bg-gradient-to-tr from-slate-900 via-blue-900 to-indigo-900 rounded-t-4xl py-16 text-white md:py-24 lg:py-32 relative overflow-hidden">
      {/* Background overlay for cosmic effect */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="container mx-auto relative z-10">
        <footer>
          <div className="mb-16 rounded-2xl bg-slate-800/30 p-8 backdrop-blur-sm border border-blue-500/20 shadow-2xl md:p-12 lg:p-16">
            <div className="flex flex-col items-center text-center">
              <h2 className="max-w-[800px] text-4xl leading-tight font-semibold tracking-tight text-balance md:text-5xl lg:text-6xl">
                Join the decentralized future.
                <span className="relative text-cyan-300 inline-block">
                  Your opportunity awaits.
                  <span className="absolute bottom-1 left-0 h-1 w-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"></span>
                </span>
              </h2>
              <p className="mt-4 max-w-[600px] text-lg text-slate-300">
                Connect with thousands of creators and nodes building the future
                of decentralized work.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <WalletConnectButton
                  variant="default"
                  size="lg"
                  className="group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-0 shadow-lg"
                  redirectTo="/dashboard"
                  showIcon={false}
                />
              </div>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="border-slate-600/20 mb-14 border-b pb-14">
            <div className="grid grid-cols-10 max-w-7xl mx-auto gap-10 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 text-2xl font-medium text-cyan-300">
                  Stay connected
                </h3>
                <p className="ml-0 text-left text-slate-300">
                  Subscribe for updates on jobs and platform news.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative grow">
                  <Input
                    type="email"
                    placeholder="Your email address"
                    className="h-12 border-slate-600/40 bg-slate-800/50 pl-10 text-white placeholder:text-slate-400 focus:border-cyan-400"
                  />
                </div>
                <Button
                  variant="secondary"
                  type="submit"
                  className="h-12 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-0"
                >
                  Subscribe
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Section */}
          <nav className="grid grid-cols-2 gap-x-6 gap-y-10 max-w-7xl mx-auto py-10 sm:grid-cols-4 lg:py-16">
            {navigation.map((section) => (
              <div key={section.title}>
                <h3 className="mb-5 text-lg font-semibold text-cyan-300">
                  {section.title}
                </h3>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="inline-block text-slate-300 transition-colors duration-200 hover:text-cyan-300"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="border-slate-600/20 border-t mx-auto flex justify-between text-white px-28 w-full mt-4 py-8">
            <div className="flex flex-col w-full items-center justify-between gap-6 sm:flex-row">
              <p className="ml-0 text-slate-300">
                © {new Date().getFullYear()} -{" "}
                <a
                  href="/"
                  className="underline transition-colors hover:text-cyan-300"
                  target="_blank"
                >
                  StarkRender
                </a>
              </p>
              <div className="flex items-center gap-6">
                {socialLinks.map((link) => (
                  <a
                    aria-label={link.label}
                    key={link.href}
                    href={link.href}
                    className="text-slate-300 transition-colors hover:text-cyan-300"
                  >
                    <link.icon
                      size={20}
                      className="transition-transform hover:scale-110"
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
};

export { FooterSection };
