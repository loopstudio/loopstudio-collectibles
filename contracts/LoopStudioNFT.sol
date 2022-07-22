// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
pragma solidity ^0.8.15;

contract LoopStudioNFT is ERC721URIStorage {
    uint256 private tokenCounter;

    constructor() ERC721("LoopStudio", "LOOP") {
        tokenCounter = 0;
    }

    function mint(string memory tokenURI) public returns (uint256) {
        _safeMint(msg.sender, tokenCounter);
        _setTokenURI(tokenCounter, tokenURI);
        tokenCounter += 1;
        return tokenCounter;
    }

    function getTokenCounter() public view returns (uint256) {
        return tokenCounter;
    }
}
