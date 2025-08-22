"use client";

import { useState, useEffect } from "react";
import { useConnect, useDisconnect, useAccount } from "@starknet-react/core";
import { Button } from "@/components/ui/button";

export function ConnectButton() {
  const [isClient, setIsClient] = useState(false);
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="text-sm text-gray-500">Loading wallet...</div>
    );
  }

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

  if (!connectors || connectors.length === 0) {
    return (
      <div className="text-sm text-gray-500">No wallet connectors available</div>
    );
  }
  
  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <Button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={!connector.available()}
        >
          Connect {connector.name}
        </Button>
      ))}
    </div>
  );
}
