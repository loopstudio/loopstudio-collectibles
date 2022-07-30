/* eslint-disable node/no-unpublished-import */
import { task } from "hardhat/config";

task("requestRandoms", "Request new randoms for LoopNFT")
  .addParam("ca", "The contract's address")
  .setAction(async (taskArgs, hre) => {
    const contractToDeploy = "LoopNFT";

    const loopNFTContract = await hre.ethers.getContractFactory(
      contractToDeploy
    );
    const loopNFT = loopNFTContract.attach(taskArgs.ca);

    const requestRandomWords = await loopNFT.requestRandomWords();

    if (requestRandomWords) {
      console.log("Transaction completed");
    }
  });
