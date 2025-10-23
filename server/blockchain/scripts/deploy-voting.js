import hre from "hardhat";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🗳️  Deploying SecureVotingContract...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MATIC\n");

  if (balance === 0n) {
    console.log("⚠️  WARNING: Deployer account has no balance!");
    console.log("   Get testnet MATIC from: https://faucet.polygon.technology");
    console.log("   Your address:", deployer.address, "\n");
    return;
  }

  // Deploy the contract
  console.log("⏳ Deploying contract...");
  const VotingContract = await hre.ethers.getContractFactory("SecureVotingContract");
  const votingContract = await VotingContract.deploy();

  await votingContract.waitForDeployment();
  const contractAddress = await votingContract.getAddress();

  console.log("\n✅ Contract deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 Block Explorer:", `https://amoy.polygonscan.com/address/${contractAddress}`);
  
  // Get deployment transaction
  const deployTx = votingContract.deploymentTransaction();
  console.log("📝 Deployment Transaction:", deployTx.hash);
  console.log("⛽ Gas Used:", deployTx.gasLimit.toString());

  // Verify initial state
  console.log("\n🔍 Verifying Contract State:");
  const admin = await votingContract.admin();
  const isActive = await votingContract.isActive();
  const totalVotes = await votingContract.totalVotes();
  const partyIds = await votingContract.getAllPartyIds();

  console.log("   Admin:", admin);
  console.log("   Voting Active:", isActive);
  console.log("   Total Votes:", totalVotes.toString());
  console.log("   Parties Initialized:", partyIds.length);

  // Display parties
  console.log("\n🎯 Default Parties:");
  for (let i = 0; i < partyIds.length; i++) {
    const partyId = partyIds[i];
    const party = await votingContract.getParty(partyId);
    console.log(`   ${i + 1}. ${party.name} ${party.logo} (${party.color}) - Votes: ${party.voteCount}`);
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    transactionHash: deployTx.hash,
    blockExplorer: `https://amoy.polygonscan.com/address/${contractAddress}`,
    contractType: 'VotingContract'
  };

  const deploymentPath = path.join(__dirname, '../config/voting-deployment.json');
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📄 Deployment info saved to: blockchain/config/voting-deployment.json");
  console.log("\n🎉 Deployment Complete!");
  console.log("\n📋 Next Steps:");
  console.log("   1. Add to server/.env file:");
  console.log(`      VOTING_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("   2. Restart your server");
  console.log("   3. Test voting functionality\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

