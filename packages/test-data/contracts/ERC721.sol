// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract ERC721Factory is ERC721URIStorage {
    constructor(string memory name, string memory ticker) ERC721(name, ticker) {}

    function mint(address user, uint256 tokenId, string memory tokenURI)
        public
        returns (uint256)
    {
        _mint(user, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }
}