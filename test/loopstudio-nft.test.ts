import { expect } from "chai";
import { ethers, deployments, network } from "hardhat";
import { VRFCoordinatorV2Mock } from "../typechain-types/@chainlink/contracts/src/v0.8/mocks";
import { LoopNFT } from "../typechain-types/contracts/LoopNFT";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { networkConfig } from "../helper-hardhat-config";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const HARDHAT_NETWORK_ID = 31337;
const NUMBER_OF_CHARACTERS = 70;

const VRF_MINIMUM_REQUEST_CONFIRMATIONS = 3;
const VRF_CALLBACK_GAS_LIMIT = 20000 * (NUMBER_OF_CHARACTERS + 10);

describe("LoopNFT", function () {
  let loopNFT: LoopNFT, vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
  let chainId: number;
  let currentNetworkConfig: Record<string, any>;
  let accounts: SignerWithAddress[];

  beforeEach(async () => {
    accounts = await ethers.getSigners();

    chainId = network.config.chainId || HARDHAT_NETWORK_ID;
    currentNetworkConfig = networkConfig[chainId];
    await deployments.fixture(["mocks", "LoopNFT"]);
    vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    loopNFT = await ethers.getContract("LoopNFT");
  });

  /**
   * Check for VRFCoordinator RandomordsRequested event emmited
   */
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

  it("Should request initialize randoms and revert if not owner", async () => {
    await expect(
      loopNFT.connect(accounts[1]).initializeRandoms()
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should initialize random numbers correctly", async () => {
    const fullfilTx = await performInitializeProcess();
    const requestId = await loopNFT.requestId();

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
    await performInitializeProcess();
    await expect(loopNFT.initializeRandoms()).to.be.revertedWith(
      "Randoms already initialized"
    );
  });

  it("Should mint an nft", async () => {
    await performInitializeProcess();
    let tokenCounter = await loopNFT.tokenCounter();
    expect(tokenCounter).to.eq(ethers.constants.Zero);
    await loopNFT.mint();
    tokenCounter = await loopNFT.tokenCounter();
    expect(tokenCounter).to.eq(ethers.constants.One);
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
