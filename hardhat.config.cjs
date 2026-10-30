require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ quiet: true });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },
  networks: {
    // In-process network used by `npx hardhat test`.
    hardhat: {
      chainId: 31337,
    },
    // Standalone node started with `npx hardhat node` (MetaMask connects here).
    localhost: {
      url: process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Public networks are intentionally NOT configured. Add one here only when you
    // deliberately decide to deploy publicly, using keys from .env (never commit them).
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
