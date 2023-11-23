/* eslint-disable no-await-in-loop */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved */
// npx hardhat run scripts/claimPong.js --network goerli
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { ethers } = require("hardhat");

const mainnetBridgeAddress = "0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe";
const testnetBridgeAddress = "0xF6BEEeBB578e214CA9E23B0e9683454Ff88Ed2A7";

const merkleProofString = "/merkle-proof";
const getClaimsFromAcc = "/bridges/";

const pathPingPongOutput = path.join(
  __dirname,
  "../deployment/pingPong_output.json"
);
const pingReceiverContractAddress =
  require(pathPingPongOutput).pingReceiverContract;

async function main() {
  const currentProvider = ethers.provider;
  let deployer;
  if (process.env.PVTKEY) {
    deployer = new ethers.Wallet(process.env.PVTKEY, currentProvider);
    console.log("Using pvtKey deployer with address: ", deployer.address);
  } else if (process.env.MNEMONIC) {
    deployer = ethers.Wallet.fromMnemonic(
      process.env.MNEMONIC,
      "m/44'/60'/0'/0/0"
    ).connect(currentProvider);
    console.log("Using MNEMONIC deployer with address: ", deployer.address);
  } else {
    [deployer] = await ethers.getSigners();
  }

  let zkEVMBridgeContractAddress;
  let baseURL;
  const networkName = process.env.HARDHAT_NETWORK;

  // Use mainnet bridge address
  if (networkName === "polygonZKEVMMainnet" || networkName === "mainnet") {
    zkEVMBridgeContractAddress = mainnetBridgeAddress;
    baseURL = "https://bridge-api.zkevm-rpc.com";
  } else if (
    networkName === "polygonZKEVMTestnet" ||
    networkName === "goerli"
  ) {
    // Use testnet bridge address
    zkEVMBridgeContractAddress = testnetBridgeAddress;
    baseURL = "https://bridge-api.public.zkevm-test.net";
  }

  const axios = require("axios").create({
    baseURL,
  });

  const bridgeFactoryZkeEVm = await ethers.getContractFactory(
    "PolygonZkEVMBridge",
    deployer
  );
  const bridgeContractZkeVM = bridgeFactoryZkeEVm.attach(
    zkEVMBridgeContractAddress
  );

  const depositAxions = await axios.get(
    getClaimsFromAcc + pingReceiverContractAddress,
    { params: { limit: 100, offset: 0 } }
  );

  const depositsArray = depositAxions.data.deposits;

  if (depositsArray.length === 0) {
    console.log("Not ready yet!");
    return;
  }

  for (let i = 0; i < depositsArray.length; i++) {
    const currentDeposit = depositsArray[i];
    console.log(`Processing deposit at index ${i}`);

    if (currentDeposit.claim_tx_hash.length !== 0) {
      console.log(
        `Deposit at index ${i} already claimed: ${currentDeposit.claim_tx_hash}`
      );
      continue;
    }

    if (currentDeposit.ready_for_claim) {
      try {
        const proofAxios = await axios.get(merkleProofString, {
          params: {
            deposit_cnt: currentDeposit.deposit_cnt,
            net_id: currentDeposit.orig_net,
          },
        });

        const { proof } = proofAxios.data;
        const claimTx = await bridgeContractZkeVM.claimMessage(
          proof.merkle_proof,
          currentDeposit.deposit_cnt,
          proof.main_exit_root,
          proof.rollup_exit_root,
          currentDeposit.orig_net,
          currentDeposit.orig_addr,
          currentDeposit.dest_net,
          currentDeposit.dest_addr,
          currentDeposit.amount,
          currentDeposit.metadata,
          { gasLimit: 3000000 }
        );

        console.log(
          `Claim message sent for deposit at index ${i}: ${claimTx.hash}`
        );
        await claimTx.wait();
        console.log(`Claim message mined for deposit at index ${i}`);
      } catch (error) {
        console.error(
          `Error processing deposit at index ${i}: ${error.message}`
        );
      }
    } else {
      console.log(`Bridge not ready for claim at index ${i}`);
    }
  }
}

async function runScriptForever() {
  while (true) {
    try {
      await main();
      console.log("Script executed successfully. Waiting for 30 seconds...");
      // Wait for 30 seconds before running the script again
      await new Promise((resolve) => setTimeout(resolve, 30000));
    } catch (error) {
      console.error(`Error running script: ${error.message}`);
    }
  }
}

runScriptForever().catch((e) => {
  console.error(e);
  process.exit(1);
});
