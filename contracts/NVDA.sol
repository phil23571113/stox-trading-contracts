//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.28;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

contract NvidiaSecurity is Ownable2Step, ERC20  {
  
    constructor (uint256 initialSupply) payable ERC20 ("NVIDIA Corp", "NVDA") Ownable(msg.sender)  {
         _mint(msg.sender, initialSupply);
    }

     function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn (address from, uint256 amount) public onlyOwner{
        require(amount != 0, "zero amt");
        _burn(from, amount);
    }

}
