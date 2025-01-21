require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.28',
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

  },
  defaultNetwork: 'hardhat',
};

