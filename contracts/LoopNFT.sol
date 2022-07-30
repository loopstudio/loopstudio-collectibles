// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract LoopNFT is VRFConsumerBaseV2, ERC721URIStorage {
  // VRF variables
  VRFCoordinatorV2Interface COORDINATOR;

  uint64 subscriptionId;
  address vrfCoordinator;
  bytes32 keyHash;
  uint32 private constant callbackGasLimit = 300000;
  uint16 private constant requestConfirmations = 3;
  uint32 private constant numWords = 5;

  uint256[] public randomWords;
  uint256 public requestId;
  address owner;

  // NFT variables
  uint256 public tokenCounter = 0;
  string[] private characterUris;

  constructor(
    uint64 _subscriptionId,
    address _vrfCoordinator,
    bytes32 _keyHask,
    string[5] memory _characterUris
  ) VRFConsumerBaseV2(_vrfCoordinator) ERC721("LoopNFT", "LOOPNFT") {
    COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
    owner = msg.sender;
    subscriptionId = _subscriptionId;
    keyHash = _keyHask;
    vrfCoordinator = _vrfCoordinator;

    characterUris = _characterUris;
  }

  function requestRandomWords() external onlyOwner {
    requestId = COORDINATOR.requestRandomWords(
      keyHash,
      subscriptionId,
      requestConfirmations,
      callbackGasLimit,
      numWords
    );
  }

  function fulfillRandomWords(
    uint256, /* requestId */
    uint256[] memory _randomWords
  ) internal override {
    randomWords = _randomWords;
  }

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  function mint() public returns (uint256) {
    require(characterUris.length > 0, "No available URIs to be minted");
    require(randomWords.length > 0, "No available random words");

    _safeMint(msg.sender, tokenCounter);
    _setTokenURI(tokenCounter, getRandomURI());

    tokenCounter += 1;

    return tokenCounter;
  }

  function getRandomURI() private returns (string memory) {
      uint8 index = uint8((randomWords[0] % characterUris.length));
      string memory uriToMint = characterUris[index];

      // Reference: https://www.youtube.com/watch?v=szv2zJcy_Xs
      string memory lastUri = characterUris[characterUris.length - 1];
      characterUris[index] = lastUri;
      characterUris.pop();
      randomWords.pop();

      return uriToMint;
  }
}
