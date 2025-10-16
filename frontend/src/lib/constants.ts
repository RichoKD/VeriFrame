/**
 * Application Constants
 */

// IPFS Gateway Configuration
export const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs";

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Get IPFS URL for a given CID
 */
export function getIpfsUrl(cid: string): string {
  return `${IPFS_GATEWAY}/${cid}`;
}
