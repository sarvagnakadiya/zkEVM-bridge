require("dotenv").config();
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@nomiclabs/hardhat-etherscan");
require("@openzeppelin/hardhat-upgrades");

const DEFAULT_MNEMONIC =
  "test test test test test test test test test test test junk";

const zkEvm_url = process.env.ZK_EVM_RPC_URL;
const goerli_url = process.env.GOERLI_RPC_URL;
/*
 * You need to export an object to set up your config
 * Go to https://hardhat.org/config/ to learn more
 */

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      {
        version: "0.6.11",
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      {
        version: "0.5.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      {
        version: "0.4.19",
        settings: {
          optimizer: {
            enabled: false,
          },
        },
      },
    ],
  },
  networks: {
    goerli: {
      url: goerli_url,
      accounts: [process.env.PVTKEY],
    },

    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: {
        mnemonic: process.env.MNEMONIC || DEFAULT_MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    hardhat: {
      initialDate: "0",
      allowUnlimitedContractSize: true,
      accounts: {
        mnemonic: process.env.MNEMONIC || DEFAULT_MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    polygonZKEVMTestnet: {
      url: zkEvm_url,
      accounts: [process.env.PVTKEY],
    },
    polygonZKEVMMainnet: {
      url: "https://zkevm-rpc.com",
      accounts: {
        mnemonic: process.env.MNEMONIC || DEFAULT_MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
  },
  gasReporter: {
    enabled: !!process.env.REPORT_GAS,
    outputFile: process.env.REPORT_GAS_FILE ? "./gas_report.md" : null,
    noColors: !!process.env.REPORT_GAS_FILE,
  },
  etherscan: {
    apiKey: {
      polygonZKEVMTestnet: `${process.env.POLYGON_ZKEVM_TESTNET}`,
      polygonZKEVMMainnet: `${process.env.ETHERSCAN_ZKEVM_API_KEY}`,
      goerli: `${process.env.GOERLI_TESTNET}`,
      mainnet: `${process.env.ETHERSCAN_API_KEY}`,
    },
    customChains: [
      {
        network: "polygonZKEVMMainnet",
        chainId: 1101,
        urls: {
          apiURL: "https://api-zkevm.polygonscan.com/api",
          browserURL: "https://zkevm.polygonscan.com/",
        },
      },
      {
        network: "polygonZKEVMTestnet",
        chainId: 1442,
        urls: {
          apiURL: "https://api-testnet-zkevm.polygonscan.com/api",
          browserURL: "https://testnet-zkevm.polygonscan.com/",
        },
      },
    ],
  },
};
