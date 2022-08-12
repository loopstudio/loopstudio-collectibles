/* eslint-disable node/no-unpublished-import */
import { task } from "hardhat/config";

task("initializeRandoms", "Request new randoms for LoopNFT")
  .addParam("ca", "The contract's address")
  .setAction(async (taskArgs, hre) => {
    const contractToDeploy = "LoopNFT";

    const loopNFTContract = await hre.ethers.getContractFactory(
      contractToDeploy
    );
    const loopNFT = loopNFTContract.attach(taskArgs.ca);

    const initializeRandoms = await loopNFT.initializeRandoms();

    if (initializeRandoms) {
      console.log("Transaction completed");
    }
  });
