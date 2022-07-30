import { ethers } from "hardhat";

(async () => {
  try {
    const contractToDeploy = "LoopNFT";
    console.log(`Starting to deploy ${contractToDeploy}`);

    const LoopNFT = await ethers.getContractFactory(contractToDeploy);

    // VRF
    const subscriptionId = 9245;
    const vrfCoordinatorAddress = "0x6168499c0cFfCaCD319c818142124B7A15E857ab";
    const keyHash =
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc";

    // NFT
    const uris = [
      "https://ipfs.io/ipfs/QmVrisQ5DV9kD7HH6Ky4PrxJYg7EiaWqxnLUoQ3np6KFUu?filename=loopjrdev.json", // jr dev
      "https://ipfs.io/ipfs/QmZ8NoCGjuDU5SA4dzGfyFRpnfWQAzGjCKwkuCSBCudgC2?filename=loopssrdev.json", // srr dev
      "https://ipfs.io/ipfs/Qme61k7jPUsuZoEcihtBB6fMN2FaaEkwr8zpcukfkdn1d7?filename=loopsrdev.json", // sr dev
      "https://ipfs.io/ipfs/QmPmY4DXRHL4msahmAmSUyY9HeJJR8udv6fv6rv3TmaPao?filename=loopssrpm.json", // ssr pm
      "https://ipfs.io/ipfs/Qmakb3sFwsXk6D15dbLYTpQHbuoT1vdGtYdYc7hKWmsWTT?filename=loopsrpm.json", // sr pm
    ];

    const loopNFT = await LoopNFT.deploy(
      subscriptionId,
      vrfCoordinatorAddress,
      keyHash,
      uris
    );

    await loopNFT.deployed();

    console.log(`${contractToDeploy} deployed successfully`);
    console.log("Addres > ", loopNFT.address);
  } catch (err) {
    console.log(`Somehting went wrong: ${err}`);
  }
})();
