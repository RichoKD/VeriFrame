"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StarknetConfig, publicProvider } from "@starknet-react/core";
import { argent } from "@starknet-react/core";
import { sepolia, mainnet } from "@starknet-react/chains";

const inter = Inter({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const chains = [sepolia, mainnet];
  const provider = publicProvider();
  const connectors = [argent()];

  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <StarknetConfig
          chains={chains}
          provider={provider}
          connectors={connectors}
          autoConnect
        >
          {children}
        </StarknetConfig>
      </body>
    </html>
  );
}
