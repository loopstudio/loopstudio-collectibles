export const networkConfig: { [key: number]: Record<string, unknown> } = {
  4: {
    name: "rinkeby",
    ethUsdPriceFeedAddress: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    subscriptionId: 9245,
    vrfCoordinatorAddress: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
    keyHash:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
  },
  137: {
    name: "polygon",
    ethUsdPriceFeedAddress: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
    // TODO: Add Polygon data for LoopNFT
  },
} as const;

export const developmentChains = ["hardhat", "localhost", "rinkeby"];
export const DECIMALS = 8;
export const INITIAL_ANSWER = 200000000000;
