// hardhat.gas.config.js
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");

module.exports = {
  gasReporter: {
    enabled: true,
    currency: "USD",
    token: "LSK",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  }
};