/* eslint-disable node/no-unpublished-import */
import { task } from "hardhat/config";

task("getRandomValues", "Request new randoms for LoopNFT")
  .addParam("ca", "The contract's address")
  .addParam("id", "Random index")
  .setAction(async (taskArgs, hre) => {
    const contractToDeploy = "LoopNFT";

    const loopNFTContract = await hre.ethers.getContractFactory(
      contractToDeploy
    );
    const loopNFT = loopNFTContract.attach(taskArgs.ca);
    const randomsWords = await loopNFT.randomWords(+taskArgs.id);
    if (randomsWords) {
      console.log("randomsWords: ", randomsWords);
    }
  });
