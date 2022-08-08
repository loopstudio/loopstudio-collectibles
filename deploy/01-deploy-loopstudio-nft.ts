import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { network, ethers } from "hardhat";

import { developmentChains, networkConfig } from "../helper-hardhat-config";
import { verify } from "../utils/verify";
import { storeTokenUriMetadata } from "../utils/uploadToPinata";
import { collectionData } from "../utils/metadata/data";

const FUND_AMOUNT = "1000000000000000000";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId || 31337;
  const currentNetworkConfig = networkConfig[chainId];

  if (!currentNetworkConfig) {
    return log("Network confguration not found");
  }

  let tokenUris;
  if (process.env.UPLOAD_TO_PINATA == "true") {
    tokenUris = await handleTokenUris();
  }

  const contractToDeploy = "LoopNFT";
  log(`Starting to deploy ${contractToDeploy}`);

  let vrfCoordinatorV2Address, subscriptionId;

  if (developmentChains.includes(network.name)) {
    const vrFCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorV2Address = vrFCoordinatorV2Mock.address;
    const tx = await vrFCoordinatorV2Mock.createSubscription();
    const txReceipt = await tx.wait(currentNetworkConfig.confirmations);

    subscriptionId = txReceipt.events[0].args.subId;

    const txFund = await vrFCoordinatorV2Mock.fundSubscription(
      subscriptionId,
      FUND_AMOUNT
    );
    await txFund.wait(currentNetworkConfig.confirmations);
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorAddress;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  const constructorArgs = [
    subscriptionId,
    vrfCoordinatorV2Address,
    networkConfig[chainId].keyHash,
    tokenUris,
  ];

  log("Deploy parameters");
  log(`subscriptionId ${constructorArgs[0]} \n`);
  log(`vrfCoordinatorAddress ${constructorArgs[1]} \n`);
  log(`keyHash ${constructorArgs[2]} \n`);
  log(`uris.length ${constructorArgs[3].length} \n`);
  log(`deployer ${deployer}`);

  const loopNFT = await deploy(contractToDeploy, {
    from: deployer,
    args: constructorArgs,
    log: true,
    waitConfirmations: currentNetworkConfig.confirmations || 6,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(loopNFT.address, constructorArgs);
  }

  log(`${contractToDeploy} deployed successfully`);
};

async function handleTokenUris() {
  let tokenUris = [];
  const data = collectionData;
  for (const looper of data) {
    console.log(`Uploading ${looper.name} `);
    const metadatauploadResponse = await storeTokenUriMetadata(looper);
    tokenUris.push(`ipfs://${metadatauploadResponse!.IpfsHash}`);
  }
  console.log("Token uris uploaded: ", tokenUris);
  return tokenUris;
}

export default func;
func.tags = ["all", "LoopNFT"];
