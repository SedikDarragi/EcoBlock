require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const networks = {};

if (process.env.SEPOLIA_RPC_URL) {
  networks.sepolia = {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  };
}

module.exports = {
  solidity: "0.8.28",
  paths: {
    sources: "./contracts/contracts",
    tests: "./contracts/test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks,
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || undefined,
  },
};
