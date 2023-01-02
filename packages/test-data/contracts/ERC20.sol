// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Factory is ERC20 {
    constructor(string memory name, string memory ticker, uint256 initialSupply) ERC20(name, ticker) {
        _mint(msg.sender, initialSupply);
    }
}
