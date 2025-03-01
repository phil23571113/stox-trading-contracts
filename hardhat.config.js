require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.28',
    settings: {
      viaIR: true,
    },
    
  },
  networks: {
    /*'base-mainnet': {
      url: 'https://mainnet.base.org',
      accounts: [process.env.WALLET_KEY],
      gasPrice: 1000000000,
    },*/
    'base-sepolia': {
      url: 'https://sepolia.base.org',
      accounts: ["d232238eb6ddf9989203b86d7c3eb00f7d4d70422d4a52e3f733234a0a9636f0"],
      gasPrice: 1000000000,
    },
    'sepolia': {
      url: 'https://eth-sepolia.public.blastapi.io',
      accounts: ["d232238eb6ddf9989203b86d7c3eb00f7d4d70422d4a52e3f733234a0a9636f0"],
      gasPrice: 1000000000,
    },
    'unichain-sepolia': {
      url: 'https://sepolia.unichain.org',
      accounts: ["d232238eb6ddf9989203b86d7c3eb00f7d4d70422d4a52e3f733234a0a9636f0"],
      gasPrice: 1000000000,
    },

  },
  defaultNetwork: 'hardhat',
  etherscan: {
    apiKey: {
     "base-sepolia": "YRJIX95DR341PB9QB39FW1HXWMXPZUQUW8"
    },
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
         apiURL: "https://api-sepolia.basescan.org/api",
         browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  },
  sourcify: {
    enabled: true
  }
};

