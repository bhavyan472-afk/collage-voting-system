import { getAddress } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { CHAIN_ID, NETWORK_PARAMS } from "../utils/contract.js";
import { parseError } from "../utils/errors.js";

function normalize(accounts) {
  // Lower-casing first accepts any casing from the wallet; getAddress returns the checksummed form.
  return accounts?.[0] ? getAddress(accounts[0].toLowerCase()) : null;
}

/** MetaMask connection state: account, chain, connect/disconnect and network switching. */
export function useWallet(notify) {
  const ethereum = typeof window !== "undefined" ? window.ethereum : undefined;
  const hasProvider = Boolean(ethereum);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!ethereum) return;
    // Restore an existing authorization silently (no popup).
    ethereum.request({ method: "eth_accounts" }).then((a) => setAccount(normalize(a))).catch(() => {});
    ethereum.request({ method: "eth_chainId" }).then((id) => setChainId(Number(id))).catch(() => {});

    // MetaMask reports the newly selected account first; [] means the site was disconnected.
    const onAccounts = (a) => setAccount(normalize(a));
    const onChain = (id) => setChainId(Number(id));
    ethereum.on?.("accountsChanged", onAccounts);
    ethereum.on?.("chainChanged", onChain);
    return () => {
      ethereum.removeListener?.("accountsChanged", onAccounts);
      ethereum.removeListener?.("chainChanged", onChain);
    };
  }, [ethereum]);

  const switchNetwork = useCallback(async () => {
    if (!ethereum) return;
    try {
      await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: NETWORK_PARAMS.chainId }] });
    } catch (err) {
      const code = err?.code ?? err?.data?.originalError?.code;
      if (code === 4902) {
        // Network not in MetaMask yet: ask MetaMask to add Hardhat Localhost (user approves).
        try {
          await ethereum.request({ method: "wallet_addEthereumChain", params: [NETWORK_PARAMS] });
          return;
        } catch (addErr) {
          notify({ type: "error", title: "Could not add network", message: parseError(addErr) });
          return;
        }
      }
      notify({ type: "error", title: "Could not switch network", message: parseError(err) });
    }
  }, [ethereum, notify]);

  const connect = useCallback(async () => {
    if (!ethereum) {
      notify({ type: "error", title: "MetaMask not found", message: "Install the MetaMask browser extension and reload the page." });
      return;
    }
    setConnecting(true);
    try {
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      const addr = normalize(accounts);
      const currentChain = Number(await ethereum.request({ method: "eth_chainId" }));
      setAccount(addr);
      setChainId(currentChain);
      notify({ type: "success", title: "Wallet connected", message: addr });
      // Offer to move to the local network right away; MetaMask asks the user to approve.
      if (currentChain !== CHAIN_ID) await switchNetwork();
    } catch (err) {
      notify({ type: "error", title: "Connection failed", message: parseError(err) });
    } finally {
      setConnecting(false);
    }
  }, [ethereum, notify, switchNetwork]);

  const disconnect = useCallback(async () => {
    // Revoking permissions makes MetaMask forget this site; ignore wallets that don't support it.
    try {
      await ethereum?.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
    } catch {
      /* not supported — clearing local state is enough */
    }
    setAccount(null);
    notify({ type: "info", title: "Wallet disconnected" });
  }, [ethereum, notify]);

  return {
    hasProvider,
    account,
    chainId,
    connecting,
    isCorrectNetwork: chainId === CHAIN_ID,
    connect,
    disconnect,
    switchNetwork,
  };
}
