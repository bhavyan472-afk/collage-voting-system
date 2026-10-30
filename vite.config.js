import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ethers.js alone is ~500 kB minified; this is expected for a dapp bundle.
  build: { chunkSizeWarningLimit: 800 },
  server: {
    port: 5173,
    // Don't reload the page when Hardhat rewrites its cache/artifacts.
    watch: { ignored: ["**/artifacts/**", "**/cache/**", "**/typechain-types/**"] },
  },
});
