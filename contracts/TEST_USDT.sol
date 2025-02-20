//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.28;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

contract MockUsdt is Ownable2Step, ERC20 {
   

    constructor() payable  ERC20("MockUsdt", "MOCKUSDT") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000_000 * 1e6);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    function burn(address from, uint256 amount) public onlyOwner {
        require(amount != 0, "zero amt");
        _burn(from, amount);
    }
}
