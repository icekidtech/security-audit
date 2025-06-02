require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Load .env file
require("hardhat-gas-reporter");
// Lisk L2 Testnet Configuration

//debugging
console.log("RPC URL:", process.env.LISK_RPC_URL);
console.log("Private key loaded:", process.env.PRIVATE_KEY ? "✅ Yes" : "❌ No");


module.exports = {
  solidity: "0.8.20",
  networks: {
    liskTestnet: {
      url: process.env.LISK_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 1134, // Update with Lisk L2 Testnet chainId
    },
    hardhat: { 
    
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    token: "LSK", // Lisk token
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  mocha: {
    timeout: 60000, // Longer timeout for security tests
  },
};