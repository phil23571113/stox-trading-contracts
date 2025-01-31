//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.28;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Orderbook is Ownable2Step, ReentrancyGuard, Pausable {
    
    

 
        constructor(address _currencyToken, address _securityToken)
        payable
        Ownable(msg.sender)
    {
       
    }
}