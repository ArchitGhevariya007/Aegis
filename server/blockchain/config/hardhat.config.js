import "@nomicfoundation/hardhat-ethers";
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' }); // Load env from server root

export default {
  solidity: "0.8.19",
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainId: 1337
    },
    amoy: {
      type: "http",
      url: process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-amoy.polygon.technology',
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY ? [process.env.BLOCKCHAIN_PRIVATE_KEY] : [],
      chainId: 80002
    }
  }
};
