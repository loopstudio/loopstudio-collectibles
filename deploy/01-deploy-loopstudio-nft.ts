import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { network } from "hardhat";

import { developmentChains, networkConfig } from "../helper-hardhat-config";
import { verify } from "../utils/verify";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId || 0;

  if (!networkConfig[chainId]) {
    return console.log("Network confguration not found");
  }

  const contractToDeploy = "LoopNFT";
  console.log(`Starting to deploy ${contractToDeploy}`);

  // TODO: Change this workaround once we have all URIs defined
  const urisToUse = [
    "https://ipfs.io/ipfs/QmVrisQ5DV9kD7HH6Ky4PrxJYg7EiaWqxnLUoQ3np6KFUu?filename=loopjrdev.json", // jr dev
    "https://ipfs.io/ipfs/QmZ8NoCGjuDU5SA4dzGfyFRpnfWQAzGjCKwkuCSBCudgC2?filename=loopssrdev.json", // srr dev
    "https://ipfs.io/ipfs/Qme61k7jPUsuZoEcihtBB6fMN2FaaEkwr8zpcukfkdn1d7?filename=loopsrdev.json", // sr dev
    "https://ipfs.io/ipfs/QmPmY4DXRHL4msahmAmSUyY9HeJJR8udv6fv6rv3TmaPao?filename=loopssrpm.json", // ssr pm
    "https://ipfs.io/ipfs/Qmakb3sFwsXk6D15dbLYTpQHbuoT1vdGtYdYc7hKWmsWTT?filename=loopsrpm.json", // sr pm
  ];
  const repeatedWors = [...Array(10)].map((_) => [...urisToUse]);
  const uris = repeatedWors.flat();

  const constructorArgs = [
    networkConfig[chainId].subscriptionId,
    networkConfig[chainId].vrfCoordinatorAddress,
    networkConfig[chainId].keyHash,
    uris,
  ];

  console.log("Deploy parameters");
  console.log(`subscriptionId ${networkConfig[chainId].subscriptionId} \n`);
  console.log(
    `vrfCoordinatorAddress ${networkConfig[chainId].vrfCoordinatorAddress} \n`
  );
  console.log(`keyHash ${networkConfig[chainId].keyHash} \n`);
  console.log(`uris.length ${uris.length} \n`);

  const basicNFT = await deploy(contractToDeploy, {
    from: deployer,
    args: constructorArgs,
    log: true,
    waitConfirmations: 3,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(basicNFT.address, constructorArgs);
  }

  console.log(`${contractToDeploy} deployed successfully`);
};
export default func;
func.tags = ["all", "LoopNFT"];
