/* eslint-disable node/no-unpublished-import */
import { task } from "hardhat/config";

task("getTokenCounter", "Request tokenCounter from LoopNFT")
  .addParam("ca", "The contract's address")
  .setAction(async (taskArgs, hre) => {
    const contractToDeploy = "LoopNFT";

    const loopNFTContract = await hre.ethers.getContractFactory(
      contractToDeploy
    );
    const loopNFT = loopNFTContract.attach(taskArgs.ca);

    const tokenCounter = await loopNFT.tokenCounter();
    if (tokenCounter) {
      console.log("tokenCounter > ", tokenCounter);
    }
  });
