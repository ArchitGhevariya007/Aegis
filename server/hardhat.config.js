import "@nomicfoundation/hardhat-ethers";
import dotenv from 'dotenv';
dotenv.config();

export default {
  solidity: "0.8.19",
  networks: {
    amoy: {
      url: process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-amoy.polygon.technology',
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY ? [process.env.BLOCKCHAIN_PRIVATE_KEY] : []
    }
  }
};
