import { expect } from "chai";
import { ethers, deployments, network, getNamedAccounts } from "hardhat";
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
      let chainId: number;
      let currentNetworkConfig: Record<string, any>;

      async function deployNFTFixture() {
        chainId = network.config.chainId || HARDHAT_NETWORK_ID;
        currentNetworkConfig = networkConfig[chainId];
        await deployments.fixture(["mocks", "LoopNFT"]);
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        loopNFT = await ethers.getContract("LoopNFT");

        return { loopNFT, vrfCoordinatorV2Mock };
      }

      /**
       * Check for VRFCoordinator RandomordsRequested event emmited
       */
      it("Should request random numbers correctly", async () => {
        const { loopNFT, vrfCoordinatorV2Mock } = await loadFixture(
          deployNFTFixture
        );

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

      it("Should request initialize randoms and revert if not owner", async () => {
        const { loopNFT } = await loadFixture(deployNFTFixture);
        let accounts = await ethers.getSigners();

        await expect(
          loopNFT.connect(accounts[1]).initializeRandoms()
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("Should initialize random numbers correctly", async () => {
        const { loopNFT } = await loadFixture(deployNFTFixture);
        await performInitializeProcess();

        // First and last words should be greater than zero
        const firstRandomNumber = await loopNFT.randomWords(0);
        const lastRandomNumber = await loopNFT.randomWords(
          NUMBER_OF_CHARACTERS - 1
        );

        expect(firstRandomNumber).gt(ethers.constants.Zero);
        expect(lastRandomNumber).gt(ethers.constants.Zero);

        // Random words size should not be >= NUMBER_OF_CHARACTERS. Accesing to that index should revert
        await expect(loopNFT.randomWords(NUMBER_OF_CHARACTERS)).to.be.reverted;
      });

      it("Should revert if randoms were already initialized", async () => {
        const { loopNFT } = await loadFixture(deployNFTFixture);
        await performInitializeProcess();
        await expect(loopNFT.initializeRandoms()).to.be.revertedWith(
          "Randoms already initialized"
        );
      });

      it("Should mint an nft", async () => {
        const { deployer } = await getNamedAccounts();

        const { loopNFT } = await loadFixture(deployNFTFixture);
        await performInitializeProcess();

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

        const nftOwner = await loopNFT.ownerOf(tokenId);
        expect(nftOwner).to.be.eq(deployer);
      });

      it("Should mint 70 items and revert next transaction", async () => {
        const { loopNFT } = await loadFixture(deployNFTFixture);
        await performInitializeProcess();

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

      async function performInitializeProcess() {
        // Request random words to chainlink
        await loopNFT.initializeRandoms();
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
    });

// constructor sizes? dificil ..habria que ver como pasar parametros al fixture
// algun test hacerlo en el momento

// SEPARAR POR FUNCION EN VARIOS DESCRIBE
