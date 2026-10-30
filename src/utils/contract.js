import { BrowserProvider, Contract, Interface, JsonRpcProvider } from "ethers";

// The deploy script writes src/contracts/VotingSystem.json (address + ABI + chainId).
// import.meta.glob lets the app build and show setup instructions even before it exists.
const deployments = import.meta.glob("../contracts/VotingSystem.json", { eager: true, import: "default" });
const deployment = Object.values(deployments)[0] ?? null;

export const RPC_URL = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || deployment?.address || null;
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || deployment?.chainId || 31337);
export const ABI = deployment?.abi ?? null;
export const IS_CONFIGURED = Boolean(CONTRACT_ADDRESS && ABI);
export const CONTRACT_INTERFACE = ABI ? new Interface(ABI) : null;

export const NETWORK_PARAMS = {
  chainId: `0x${CHAIN_ID.toString(16)}`,
  chainName: "Hardhat Localhost",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: [RPC_URL],
};

let readProvider = null;

/** Read-only provider pointed at the local node — works without MetaMask. */
export function getReadProvider() {
  if (!readProvider) {
    readProvider = new JsonRpcProvider(RPC_URL, CHAIN_ID, { staticNetwork: true });
  }
  return readProvider;
}

export function getReadContract() {
  return new Contract(CONTRACT_ADDRESS, ABI, getReadProvider());
}

/**
 * Contract bound to the MetaMask signer for `account`. A fresh BrowserProvider avoids stale-network
 * errors, and pinning the address guarantees we never sign with a different account than the UI shows.
 */
export async function getWriteContract(account) {
  if (!window.ethereum) throw new Error("MetaMask is not installed.");
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner(account);
  return new Contract(CONTRACT_ADDRESS, ABI, signer);
}

/**
 * Unlocked accounts of the local Hardhat node (its 20 public test accounts, in order #0..#19).
 * Used only to tell the user which test account they are connected with; returns [] on other nodes.
 */
export async function getDevAccounts() {
  try {
    const accounts = await getReadProvider().send("eth_accounts", []);
    return accounts.map((a) => a.toLowerCase());
  } catch {
    return [];
  }
}

export const ElectionState = Object.freeze({ Setup: 0, Active: 1, Ended: 2 });
