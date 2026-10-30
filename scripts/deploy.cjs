// Deploys VotingSystem and writes the address + ABI to src/contracts/VotingSystem.json
// so the React frontend picks it up automatically.
//
// Usage:  npx hardhat run scripts/deploy.cjs --network localhost
// Env:    ELECTION_NAME  (optional) name stored on-chain
//         SEED_DEMO      (optional, default "true" on local networks) add demo candidates and
//                        register Hardhat test accounts #1-#5 as eligible voters.
const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

const LOCAL_CHAIN_IDS = new Set([31337n, 1337n]);

const DEMO_CANDIDATES = [
  {
    name: "Aarav Sharma",
    party: "Progressive Students Alliance",
    symbol: "🌱",
    description: "Solar-powered study zones, a campus-wide recycling drive, and more green spaces between blocks.",
  },
  {
    name: "Diya Patel",
    party: "Unity Front",
    symbol: "🤝",
    description: "24/7 library access during exams, better hostel food, and a transparent student grievance portal.",
  },
  {
    name: "Kabir Singh",
    party: "Tech Forward",
    symbol: "💡",
    description: "Faster campus Wi-Fi, a coding & maker lab open to every department, and hackathon funding.",
  },
  {
    name: "Meera Iyer",
    party: "Cultural Collective",
    symbol: "🎭",
    description: "A bigger annual fest, more inter-college sports meets, and funding for student clubs.",
  },
];

async function main() {
  const { ethers, network } = hre;
  const [deployer, ...others] = await ethers.getSigners();
  const { chainId } = await ethers.provider.getNetwork();
  const isLocal = LOCAL_CHAIN_IDS.has(chainId);

  if (!isLocal) {
    throw new Error(
      `Refusing to deploy to non-local chain ${chainId}. This demo only deploys to a local Hardhat node.`
    );
  }

  const electionName = process.env.ELECTION_NAME || "Student Council Election 2026";
  console.log(`Network:   ${network.name} (chainId ${chainId})`);
  console.log(`Deployer:  ${deployer.address}`);

  const Voting = await ethers.getContractFactory("VotingSystem");
  const voting = await Voting.deploy(electionName);
  await voting.waitForDeployment();
  const address = await voting.getAddress();
  console.log(`VotingSystem deployed to: ${address}`);

  const seed = (process.env.SEED_DEMO ?? "true").toLowerCase() !== "false";
  if (seed) {
    for (const c of DEMO_CANDIDATES) {
      await (await voting.addCandidate(c.name, c.party, c.symbol, c.description)).wait();
      console.log(`  + candidate ${c.symbol} ${c.name} (${c.party})`);
    }
    const voters = others.slice(0, 5).map((s) => s.address);
    await (await voting.registerVoters(voters)).wait();
    voters.forEach((v, i) => console.log(`  + eligible voter (Account #${i + 1}) ${v}`));
    console.log("Election is in Setup state. Start it from the Admin page or with the owner account.");
  }

  const artifact = await hre.artifacts.readArtifact("VotingSystem");
  const outDir = path.join(__dirname, "..", "src", "contracts");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "VotingSystem.json");
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        address,
        chainId: Number(chainId),
        network: network.name,
        deployedAt: new Date().toISOString(),
        abi: artifact.abi,
      },
      null,
      2
    )
  );
  console.log(`Frontend config written to ${path.relative(process.cwd(), outFile)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
