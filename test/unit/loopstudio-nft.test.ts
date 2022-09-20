import { expect } from "chai";
import {
  ethers,
  deployments,
  network,
  getNamedAccounts,
  getUnnamedAccounts,
} from "hardhat";
import { VRFCoordinatorV2Mock } from "../../typechain-types/@chainlink/contracts/src/v0.8/mocks";
import { LoopNFT } from "../../typechain-types/contracts/LoopNFT";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { networkConfig, developmentChains } from "../../helper-hardhat-config";

const HARDHAT_NETWORK_ID = 31337;
const NUMBER_OF_CHARACTERS = 70;

const VRF_MINIMUM_REQUEST_CONFIRMATIONS = 3;
const VRF_CALLBACK_GAS_LIMIT = 20000 * (NUMBER_OF_CHARACTERS + 10);

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("LoopNFT", function () {
      let loopNFT: LoopNFT, vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
      let chainId = network.config.chainId || HARDHAT_NETWORK_ID;
      let currentNetworkConfig = networkConfig[chainId];

      beforeEach(async function () {
        ({ loopNFT, vrfCoordinatorV2Mock } = await loadFixture(
          deployNFTFixture
        ));
      });

      async function deployNFTFixture() {
        await deployments.fixture(["mocks", "LoopNFT"]);
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        loopNFT = await ethers.getContract("LoopNFT");

        return { loopNFT, vrfCoordinatorV2Mock };
      }

      async function mockChainlinkNodeCall() {
        const requestId = await loopNFT.requestId();

        // Simulates that chainlink node interacts with Coordinator contract fulfilling with random words
        const fullfilTx = await vrfCoordinatorV2Mock.fulfillRandomWords(
          requestId,
          loopNFT.address
        );

        // Coordintor should emit RandomWordsFulfilled correcty
        await expect(fullfilTx)
          .to.emit(vrfCoordinatorV2Mock, "RandomWordsFulfilled")
          .withArgs(requestId, requestId, anyValue, true);
      }

      describe("constructor", function () {
        it("Should set the right owner", async () => {
          const { deployer } = await getNamedAccounts();

          await expect(await loopNFT.owner()).to.be.eq(deployer);
        });
      });

      describe("initializeRandoms", function () {
        it("Should request random numbers correctly", async () => {
          await expect(loopNFT.initializeRandoms())
            .to.emit(vrfCoordinatorV2Mock, "RandomWordsRequested")
            .withArgs(
              currentNetworkConfig.keyHash,
              anyValue,
              anyValue,
              currentNetworkConfig.subscriptionId,
              VRF_MINIMUM_REQUEST_CONFIRMATIONS,
              VRF_CALLBACK_GAS_LIMIT,
              NUMBER_OF_CHARACTERS,
              loopNFT.address
            );
        });

        it("Should revert if not owner", async () => {
          let user = await ethers.getSigner((await getUnnamedAccounts())[0]);
          await expect(
            loopNFT.connect(user).initializeRandoms()
          ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should initialize random numbers correctly", async () => {
          await loopNFT.initializeRandoms();

          await mockChainlinkNodeCall();

          // First and last words should be greater than zero
          const firstRandomNumber = await loopNFT.randomWords(0);
          const lastRandomNumber = await loopNFT.randomWords(
            NUMBER_OF_CHARACTERS - 1
          );

          expect(firstRandomNumber).gt(ethers.constants.Zero);
          expect(lastRandomNumber).gt(ethers.constants.Zero);

          // Random words size should not be >= NUMBER_OF_CHARACTERS. Accesing to that index should revert
          await expect(loopNFT.randomWords(NUMBER_OF_CHARACTERS)).to.be
            .reverted;
        });

        it("Should revert if randoms were already initialized", async () => {
          await loopNFT.initializeRandoms();
          await mockChainlinkNodeCall();
          await expect(loopNFT.initializeRandoms()).to.be.revertedWith(
            "Randoms already initialized"
          );
        });
      });

      describe("mint", function () {
        it("Should mint an nft", async () => {
          const { deployer } = await getNamedAccounts();
          await loopNFT.initializeRandoms();
          await mockChainlinkNodeCall();

          const tokenId = await loopNFT.tokenCounter();
          expect(tokenId).to.eq(ethers.constants.Zero);

          const mintTx = await loopNFT.mint();
          expect(mintTx)
            .to.emit(loopNFT, "Transfer")
            .withArgs(ethers.constants.AddressZero, deployer, tokenId);

          const tokenCounter = await loopNFT.tokenCounter();
          expect(tokenCounter).to.eq(ethers.constants.One);

          const uri = await loopNFT.tokenURI(tokenId);
          expect(uri).to.be.not.null;
          expect(typeof uri).to.be.eq("string");
          console.log("uri", uri);
        });

        it("Should mint 70 items and revert next transaction", async () => {
          await loopNFT.initializeRandoms();
          await mockChainlinkNodeCall();

          let tokenCounter = await loopNFT.tokenCounter();
          expect(tokenCounter).to.eq(ethers.constants.Zero);

          // exhaust the amount of available nfts
          for (let i = 0; i < NUMBER_OF_CHARACTERS; i++) {
            await loopNFT.mint();
          }
          tokenCounter = await loopNFT.tokenCounter();
          expect(tokenCounter).to.eq(NUMBER_OF_CHARACTERS);

          // claim should be reverted since there shouldnt be any uri available
          await expect(loopNFT.mint()).to.be.revertedWith(
            "No available URIs to be minted"
          );

          // randoms should be empty
          await expect(loopNFT.randomWords(0)).to.be.reverted;
        });
      });
    });
