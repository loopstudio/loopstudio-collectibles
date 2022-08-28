import { expect } from "chai";
import { ethers, network, getNamedAccounts } from "hardhat";
import { LoopNFT } from "../../typechain-types/contracts/LoopNFT";

import { networkConfig, developmentChains } from "../../helper-hardhat-config";
import { Contract } from "ethers";

const HARDHAT_NETWORK_ID = 31337;

developmentChains.includes(network.name)
  ? describe.skip
  : describe("LoopNFT", function () {
      let loopNFT: LoopNFT, vrfCoordinatorV2: Contract;
      let chainId = network.config.chainId || HARDHAT_NETWORK_ID;
      let currentNetworkConfig = networkConfig[chainId];

      before(async function () {
        const loopNFTContract = await ethers.getContractFactory("LoopNFT");
        loopNFT = loopNFTContract.attach(
          process.env.LOOP_NFT_RINKEBY_ADDRESS!
        ) as LoopNFT;
      });

      it("Should mint an NFT", async () => {
        const { deployer } = await getNamedAccounts();
        const tokenId = await loopNFT.tokenCounter();

        console.log("Starting minting...");
        const tx = await loopNFT.mint();
        console.log(
          `Waiting ${currentNetworkConfig.confirmations} block confirmations`
        );
        await tx.wait(currentNetworkConfig.confirmations);
        expect(tx)
          .to.emit(loopNFT, "Transfer")
          .withArgs(ethers.constants.AddressZero, deployer, tokenId);

        const tokenCounter = await loopNFT.tokenCounter();
        console.log(
          `Previous token counter: ${tokenId}. Current: ${tokenCounter}`
        );
        expect(tokenCounter).to.be.eq(tokenId.add(1));
        const uri = await loopNFT.tokenURI(tokenId);
        expect(uri).to.be.not.null;
        const nftOwner = await loopNFT.ownerOf(tokenId);
        expect(nftOwner).to.be.eq(deployer);
      });
    });
