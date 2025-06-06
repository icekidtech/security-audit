import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const LISK_L2_RPC_URL = process.env.LISK_L2_RPC_URL || "https://documentation.lisk.com/docs/lisk-l2-testnet";
const LISK_L2_CHAIN_ID = parseInt(process.env.LISK_L2_CHAIN_ID || "1101");

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    liskL2Testnet: {
      url: LISK_L2_RPC_URL,
      chainId: LISK_L2_CHAIN_ID,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;