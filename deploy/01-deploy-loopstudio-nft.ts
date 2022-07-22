import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { network } from "hardhat";
import { developmentChains, networkConfig } from "../helper-hardhat-config";
import { verify } from "../utils/verify";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  const constructorArgs: any = [];
  const basicNFT = await deploy("LoopStudioNFT", {
    from: deployer,
    args: constructorArgs,
    log: true,
    waitConfirmations: 3,
  });
  console.log("Deployed LoopStudioNFT");
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(basicNFT.address, constructorArgs);
  }
};
export default func;
func.tags = ["all", "LoopStudioNFT"];
