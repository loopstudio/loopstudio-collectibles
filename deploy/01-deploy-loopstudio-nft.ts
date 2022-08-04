import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { network, ethers } from "hardhat";

import { developmentChains, networkConfig } from "../helper-hardhat-config";
import { verify } from "../utils/verify";

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

  const contractToDeploy = "LoopNFT";
  log(`Starting to deploy ${contractToDeploy}`);

  // TODO: Change this workaround once we have all URIs defined
  const urisToUse = [
    "https://ipfs.io/ipfs/QmVrisQ5DV9kD7HH6Ky4PrxJYg7EiaWqxnLUoQ3np6KFUu?filename=loopjrdev.json", // jr dev
    "https://ipfs.io/ipfs/QmZ8NoCGjuDU5SA4dzGfyFRpnfWQAzGjCKwkuCSBCudgC2?filename=loopssrdev.json", // srr dev
    "https://ipfs.io/ipfs/Qme61k7jPUsuZoEcihtBB6fMN2FaaEkwr8zpcukfkdn1d7?filename=loopsrdev.json", // sr dev
    "https://ipfs.io/ipfs/QmPmY4DXRHL4msahmAmSUyY9HeJJR8udv6fv6rv3TmaPao?filename=loopssrpm.json", // ssr pm
    "https://ipfs.io/ipfs/Qmakb3sFwsXk6D15dbLYTpQHbuoT1vdGtYdYc7hKWmsWTT?filename=loopsrpm.json", // sr pm
  ];
  const repeatedWords = [...Array(10)].map((_) => [...urisToUse]);
  const uris = repeatedWords.flat();

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
    uris,
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
export default func;
func.tags = ["all", "LoopNFT"];
