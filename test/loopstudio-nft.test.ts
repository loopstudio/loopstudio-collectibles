import { expect } from "chai";
import { ethers, deployments, network } from "hardhat";
import { VRFCoordinatorV2Mock } from "../typechain-types/@chainlink/contracts/src/v0.8/mocks";
import { LoopNFT } from "../typechain-types/contracts/LoopNFT";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { networkConfig } from "../helper-hardhat-config";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const HARDHAT_NETWORK_ID = 31337;
const NUMBER_OF_CHARACTERS = 70;

const VRF_MINIMUM_REQUEST_CONFIRMATIONS = 3;
const VRF_CALLBACK_GAS_LIMIT = 20000 * (NUMBER_OF_CHARACTERS + 10);

describe("LoopNFT", async function () {
  let loopNFT: LoopNFT, vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
  let chainId: number;
  let currentNetworkConfig: Record<string, any>;
  let accounts = await ethers.getSigners();

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
    const { loopNFT } = await loadFixture(deployNFTFixture);
    await performInitializeProcess();
    let tokenCounter = await loopNFT.tokenCounter();
    expect(tokenCounter).to.eq(ethers.constants.Zero);
    await loopNFT.mint();
    tokenCounter = await loopNFT.tokenCounter();
    expect(tokenCounter).to.eq(ethers.constants.One);
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

    // after the collection is empty, it could be reinitialized
    await performInitializeProcess();
    const firstRandomNumber = await loopNFT.randomWords(0);
    expect(firstRandomNumber).gt(ethers.constants.Zero); // FIXME this should fail! now we cant mint ..
    await loopNFT.mint();
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

// initializeRandoms by not owner (revert con matcheo de mensaje?) [x]
// initializeRandoms twice [x]
// mint & events
// mint and check token counter [x]
// mint after 70 requests should fail [x]
// constructor sizes? dificil ..habria que ver como pasar parametros al fixture

// leer sobre chai
// leer sobre smart contracts testing
// leer sobre hardhat testing

// mostrar mas en detalle los contratos
// mover a un utils los files ipfs

// que es waffle y como usa chai y mocka https://ethereum-waffle.readthedocs.io/en/latest/matchers.html
// https://getwaffle.io
// https://hardhat.org/hardhat-chai-matchers/docs/overview

// algun test hacerlo en el momento

// BUG-> cuando se gastan los NFTs se puede llamar a initialize de nuevo
