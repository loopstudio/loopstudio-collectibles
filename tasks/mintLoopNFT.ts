/* eslint-disable node/no-unpublished-import */
import { task } from "hardhat/config";

task("mintLoopNFT", "Mint a new LoopNFT")
  .addParam("ca", "The contract's address")
  .setAction(async (taskArgs, hre) => {
    const contractToDeploy = "LoopNFT";

    const loopNFTContract = await hre.ethers.getContractFactory(
      contractToDeploy
    );
    const loopNFT = loopNFTContract.attach(taskArgs.ca);

    const mintProcess = await loopNFT.mint();

    if (mintProcess) {
      console.log("Transaction completed");
    }
  });
