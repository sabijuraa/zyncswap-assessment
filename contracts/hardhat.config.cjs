require("@nomicfoundation/hardhat-toolbox");
const path = require("path");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  paths: {
    sources:  path.join(__dirname, "contracts"),
    tests:    path.join(__dirname, "test"),
    cache:    path.join(__dirname, "cache"),
    artifacts: path.join(__dirname, "artifacts"),
  },
  mocha: {
    timeout: 120000,
  },
};
