import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONTRACT_ADDRESS,
  IS_CONFIGURED,
  getDevAccounts,
  getReadContract,
  getReadProvider,
  getWriteContract,
} from "../utils/contract.js";
import { parseError } from "../utils/errors.js";

const POLL_MS = 5000;

const IDLE_TX = { status: "idle", label: "", hash: null, blockNumber: null, error: null };

function toCandidate(c) {
  return {
    id: Number(c.id),
    name: c.name,
    party: c.party,
    symbol: c.symbol,
    description: c.description,
    voteCount: Number(c.voteCount),
  };
}

const sameAddress = (a, b) => Boolean(a && b && a.toLowerCase() === b.toLowerCase());

/**
 * Reads election data from the chain (polling) and sends transactions through MetaMask,
 * exposing transaction progress: preflight → signing → pending → confirmed | failed.
 */
export function useElection(wallet, notify) {
  const { account, isCorrectNetwork, hasProvider } = wallet;
  const [data, setData] = useState({ info: null, candidates: [], leaders: [], voter: null });
  const [loading, setLoading] = useState(IS_CONFIGURED);
  const [loadError, setLoadError] = useState(null);
  const [tx, setTx] = useState(IDLE_TX);
  const [devAccounts, setDevAccounts] = useState([]);
  const latestRequest = useRef(0);

  // Per-account data must never outlive the account it belongs to.
  useEffect(() => {
    setData((d) => ({ ...d, voter: null }));
  }, [account]);

  useEffect(() => {
    if (IS_CONFIGURED) getDevAccounts().then(setDevAccounts);
  }, []);

  const refresh = useCallback(async () => {
    if (!IS_CONFIGURED) return;
    // Only the newest request may update state, so a slow response for a previous
    // account can't overwrite data for the account that is connected now.
    const requestId = ++latestRequest.current;
    try {
      const code = await getReadProvider().getCode(CONTRACT_ADDRESS);
      if (code === "0x") {
        throw new Error(
          `No contract found at ${CONTRACT_ADDRESS}. The local chain was probably restarted — run "npm run deploy:local" again.`
        );
      }
      const contract = getReadContract();
      const [info, candidates, leaders, voter] = await Promise.all([
        contract.getElectionInfo(),
        contract.getCandidates(),
        contract.getLeaders(),
        account ? contract.getVoterStatus(account) : Promise.resolve(null),
      ]);
      if (requestId !== latestRequest.current) return;
      setData({
        info: {
          name: info.name,
          state: Number(info.currentState),
          // Read from the contract's owner() via getElectionInfo — the on-chain source of truth.
          admin: info.admin,
          candidateCount: Number(info.candidates),
          totalVotes: Number(info.votes),
          eligibleVoters: Number(info.eligibleVoters),
          startTime: Number(info.startTime),
          endTime: Number(info.endTime),
        },
        candidates: candidates.map(toCandidate),
        leaders: leaders.leaderIds.map(Number),
        voter: voter ? { eligible: voter.eligible, voted: voter.voted } : null,
      });
      setLoadError(null);
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      setLoadError(err.message?.startsWith("No contract found") ? err.message : parseError(err));
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (!IS_CONFIGURED) return;
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const isAdmin = Boolean(data.info && sameAddress(account, data.info.admin));

  const send = useCallback(
    async (label, method, args = [], successMessage, { adminOnly = false } = {}) => {
      if (!hasProvider) {
        notify({ type: "error", title: "MetaMask required", message: "Install MetaMask to send transactions." });
        return false;
      }
      if (!account) {
        notify({ type: "error", title: "Wallet not connected", message: "Connect your MetaMask wallet first." });
        return false;
      }
      if (!isCorrectNetwork) {
        notify({ type: "error", title: "Wrong network", message: "Switch MetaMask to the Hardhat Localhost network (chain 31337)." });
        return false;
      }
      // UX pre-check only — the contract's onlyOwner modifier is the real authorization.
      if (adminOnly && !isAdmin) {
        notify({
          type: "error",
          title: "Not the election admin",
          message: `Only the contract owner (${data.info?.admin}) can do this. Select that account in MetaMask.`,
        });
        return false;
      }

      setTx({ ...IDLE_TX, status: "preflight", label });
      try {
        // Make sure MetaMask's selected account is still the one shown in the UI.
        const selected = await window.ethereum.request({ method: "eth_accounts" });
        if (!sameAddress(selected?.[0], account)) {
          throw new Error("The selected MetaMask account changed. Please review the connected account and try again.");
        }

        // Simulate first against the node so contract errors are decoded clearly
        // before MetaMask ever opens.
        await getReadContract()[method].staticCall(...args, { from: account });

        setTx((t) => ({ ...t, status: "signing" }));
        const contract = await getWriteContract(account);
        const sent = await contract[method](...args);

        setTx((t) => ({ ...t, status: "pending", hash: sent.hash }));
        const receipt = await sent.wait();
        if (!receipt || receipt.status !== 1) throw new Error("Transaction reverted.");

        setTx((t) => ({ ...t, status: "confirmed", blockNumber: receipt.blockNumber }));
        notify({ type: "success", title: `${label} confirmed`, message: successMessage ?? `Included in block #${receipt.blockNumber}.` });
        await refresh();
        return true;
      } catch (err) {
        const message = parseError(err);
        setTx((t) => ({ ...t, status: "failed", error: message }));
        notify({ type: "error", title: `${label} failed`, message });
        return false;
      }
    },
    [account, hasProvider, isCorrectNetwork, isAdmin, data.info?.admin, notify, refresh]
  );

  const admin = { adminOnly: true };
  const actions = {
    vote: (candidate) =>
      send("Vote", "vote", [candidate.id], `Your vote for ${candidate.name} is recorded on-chain.`),
    addCandidate: ({ name, party, symbol, description }) =>
      send("Add candidate", "addCandidate", [name, party, symbol, description], `${name} was added as a candidate.`, admin),
    registerVoters: (addresses) =>
      send("Register voters", "registerVoters", [addresses], `${addresses.length} address(es) processed.`, admin),
    removeVoter: (address) => send("Remove voter", "removeVoter", [address], undefined, admin),
    startElection: () => send("Start election", "startElection", [], "Voting is now open.", admin),
    endElection: () => send("End election", "endElection", [], "Voting is closed. Results are final.", admin),
  };

  const checkVoter = useCallback(async (address) => {
    const status = await getReadContract().getVoterStatus(address);
    return { eligible: status.eligible, voted: status.voted };
  }, []);

  // Index of the connected wallet among the local node's test accounts (-1 = not a Hardhat test account).
  const devAccountIndex = account ? devAccounts.indexOf(account.toLowerCase()) : -1;
  const busy = ["preflight", "signing", "pending"].includes(tx.status);

  return {
    ...data,
    loading,
    loadError,
    refresh,
    tx,
    busy,
    clearTx: () => setTx(IDLE_TX),
    isAdmin,
    devAccountIndex,
    hasDevAccounts: devAccounts.length > 0,
    checkVoter,
    ...actions,
  };
}
