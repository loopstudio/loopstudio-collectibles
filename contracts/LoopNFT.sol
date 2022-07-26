// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LoopNFT is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    // VRF variables
    VRFCoordinatorV2Interface coordinator;

    uint64 private immutable subscriptionId;
    address private immutable vrfCoordinator;
    bytes32 private immutable keyHash;
    uint32 private constant callbackGasLimit = 20000 * (numWords + 10);
    uint16 private constant requestConfirmations = 3;
    uint32 private constant numWords = 70;

    uint256[] public randomWords;
    uint256 public requestId;

    // NFT variables
    uint256 public tokenCounter = 0;
    string[] private characterUris;

    constructor(
        uint64 _subscriptionId,
        address _vrfCoordinator,
        bytes32 _keyHask,
        string[70] memory _characterUris
    )
        VRFConsumerBaseV2(_vrfCoordinator)
        ERC721("LoopCollectibles", "LoopCollectibles")
    {
        require(
            _characterUris.length == numWords,
            "Randoms and URI arrays have different length"
        );

        coordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHask;
        vrfCoordinator = _vrfCoordinator;
        characterUris = _characterUris;
    }

    function initializeRandoms() external onlyOwner {
        require(randomWords.length == 0, "Randoms already initialized");

        requestRandomWords();
    }

    function requestRandomWords() private {
        requestId = coordinator.requestRandomWords(
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

    function mint() public returns (uint256) {
        require(characterUris.length > 0, "No available URIs to be minted");
        require(randomWords.length > 0, "No available random words");

        _safeMint(msg.sender, tokenCounter);
        _setTokenURI(tokenCounter, calculateRandomURI());

        tokenCounter += 1;

        return tokenCounter;
    }

    function calculateRandomURI() private returns (string memory) {
        uint256 index = randomWords[0] % characterUris.length;
        string memory uriToMint = characterUris[index];

        // Reference: https://www.youtube.com/watch?v=szv2zJcy_Xs
        string memory lastUri = characterUris[characterUris.length - 1];
        characterUris[index] = lastUri;
        characterUris.pop();
        randomWords.pop();

        return uriToMint;
    }
}
