import { CONTRACT_INTERFACE, RPC_URL } from "./contract.js";

const STATE_MESSAGES = {
  0: "The election has not started yet.",
  1: "This action is not allowed while the election is active.",
  2: "The election has already ended.",
};

const CUSTOM_ERRORS = {
  NotOwner: () => "Only the election administrator (contract owner) can do this.",
  ZeroAddress: () => "The zero address is not allowed.",
  InvalidState: (args) => STATE_MESSAGES[Number(args[1])] ?? "Action not allowed in the current election phase.",
  InvalidCandidate: (args) => `Candidate #${args[0]} does not exist.`,
  NotEligible: () => "This wallet is not registered as an eligible voter.",
  AlreadyVoted: () => "This wallet has already voted. Each eligible wallet can vote only once.",
  NoCandidates: () => "Add at least one candidate before starting the election.",
  TooManyCandidates: () => "The maximum number of candidates has been reached.",
  BatchTooLarge: () => "Too many addresses in one batch (max 200).",
  EmptyField: (args) => `The "${args[0]}" field is required.`,
  FieldTooLong: (args) => `The "${args[0]}" field is too long.`,
};

/** Recursively look for ABI-encoded revert data inside nested provider errors. */
function findRevertData(err, depth = 0) {
  if (!err || typeof err !== "object" || depth > 6) return null;
  if (typeof err.data === "string" && /^0x[0-9a-fA-F]{8}/.test(err.data)) return err.data;
  for (const key of ["data", "error", "info", "cause", "payload"]) {
    const found = findRevertData(err[key], depth + 1);
    if (found) return found;
  }
  return null;
}

function decodeCustomError(err) {
  let decoded = err?.revert ?? null;
  if (!decoded && CONTRACT_INTERFACE) {
    const data = findRevertData(err);
    if (data) {
      try {
        decoded = CONTRACT_INTERFACE.parseError(data);
      } catch {
        decoded = null;
      }
    }
  }
  if (!decoded?.name) return null;
  const formatter = CUSTOM_ERRORS[decoded.name];
  return formatter ? formatter(decoded.args ?? []) : `Contract error: ${decoded.name}`;
}

/** Turn any ethers / MetaMask / contract error into a human-readable message. */
export function parseError(err) {
  if (!err) return "Unknown error.";

  const code = err.code ?? err.info?.error?.code ?? err.error?.code;
  if (code === "ACTION_REJECTED" || code === 4001) return "You rejected the request in MetaMask.";

  const custom = decodeCustomError(err);
  if (custom) return custom;

  if (code === "INSUFFICIENT_FUNDS") return "This wallet does not have enough ETH to pay for gas.";
  if (code === -32002) return "A MetaMask request is already pending. Open MetaMask to continue.";
  if (code === "NETWORK_ERROR" || code === "ECONNREFUSED" || /failed to fetch|ECONNREFUSED/i.test(err.message ?? "")) {
    return `Cannot reach the blockchain node at ${RPC_URL}. Is "npx hardhat node" running?`;
  }
  if (/nonce/i.test(err.message ?? "")) {
    return "Nonce mismatch — the local chain was probably restarted. In MetaMask: Settings → Advanced → Clear activity tab data, then retry.";
  }
  return err.shortMessage || err.reason || err.message || "Something went wrong.";
}
