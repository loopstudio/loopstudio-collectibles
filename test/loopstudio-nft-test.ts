import { expect } from "chai";
import { ethers } from "hardhat";
import { LoopStudioNFT } from "../typechain-types/contracts/LoopStudioNFT";
describe("LoopStudioNFT", function () {
  it("Should deploy and mint", async function () {
    const LoopStudioNFT = await ethers.getContractFactory("LoopStudioNFT");
    const loopstudioNFT = (await LoopStudioNFT.deploy()) as LoopStudioNFT;
    await loopstudioNFT.deployed();

    const mintTx = await loopstudioNFT.mint("randomUri");
    // wait until the transaction is mined
    await mintTx.wait();

    expect(await loopstudioNFT.tokenURI(0)).to.equal("randomUri");
  });
});
