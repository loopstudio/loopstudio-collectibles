export const networkConfig: { [key: number]: Record<string, any> } = {
  31337: {
    name: "localhost",
    keyHash:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
    confirmations: 1,
    subscriptionId: 1,
  },
  137: {
    name: "polygon",
    confirmations: 6,

    // TODO: Add Polygon data for LoopNFT
  },
  80001: {
    name: "muambai",
    subscriptionId: "1379",
    vrfCoordinatorAddress: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
    keyHash:
      "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
    confirmations: 2,
    loopNFTAddress: "0xc8E9deE7A6f555B773899b6E6586E60b8d36339A",
  },
};

export const developmentChains = ["hardhat", "localhost"];
