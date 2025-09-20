import "@nomicfoundation/hardhat-ethers";
import dotenv from 'dotenv';
dotenv.config();

export default {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    amoy: {
      url: process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-amoy.polygon.technology',
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY ? [process.env.BLOCKCHAIN_PRIVATE_KEY] : [],
      chainId: 80002,
      gasPrice: 35000000000
    }
  }
};
