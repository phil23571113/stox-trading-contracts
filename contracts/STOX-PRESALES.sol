//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.28;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract UniversePreSale is Ownable2Step, ReentrancyGuard, Pausable {

    using SafeERC20 for IERC20;

    AggregatorV3Interface internal ethUsdPriceFeed;

    IERC20 public utilityToken;
    IERC20 public usdt;
    IERC20 public usdc;

    uint256 public totalSold;
    uint256 public presaleUsdPrice;
    uint256 public minPurchase;
    uint256 public maxPurchase;
    uint256 public presaleStartTime;
    uint256 public presaleEndTime;
    uint256 public softCap;
    uint256 public hardCap;
    uint256 public lockPeriod;


    struct TokenPurchase {
        uint256 paymentAmount;
        uint256 tokenAmount;
        uint256 unlockTime;
    }


    mapping(address => mapping(address => TokenPurchase)) public utilityTokenPurchases;
    

    bool public presaleFinalized;

    event TokensPurchased(
        address indexed buyer,
        address indexed paymentCurrency,
        uint256 paymentAmount,
        uint256 tokenAmount
    );

    event PresaleFinalized(uint256 totalSold);

    constructor(
        address _utilityToken,
        address _usdt,
        address _usdc,
        address _ethUsdPriceFeed,
        uint256 _presaleUsdPrice,
        uint256 _minPurchase,
        uint256 _maxPurchase,
        uint256 _presaleStartTime,
        uint256 _presaleEndTime,
        uint256 _softCap,
        uint256 _hardCap,
        uint256 _lockPeriod
    ) payable Ownable(msg.sender)  {
        require(_utilityToken != address(0), "Invalid token address");
        require(_usdt != address(0), "Invalid usdt address");
        require(_usdc != address(0), "Invalid usdc address");
        require(_presaleUsdPrice != 0, "Invalid price");
        require(_minPurchase != 0, "Invalid min purchase");
        require(_maxPurchase >= _minPurchase, "Invalid max purchase");
        require(_presaleStartTime > block.timestamp, "Invalid start time");
        require(_presaleEndTime > _presaleStartTime, "Invalid end time");
        require(_hardCap != 0, "Invalid hard cap");
        require(_hardCap > _softCap, "Invalid soft cap");

        utilityToken = IERC20(_utilityToken);
        usdt = IERC20(_usdt);
        usdc = IERC20(_usdc);

        ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);

        presaleUsdPrice = _presaleUsdPrice;
        minPurchase = _minPurchase;
        maxPurchase = _maxPurchase;
        presaleStartTime = _presaleStartTime;
        presaleEndTime = _presaleEndTime;
        hardCap = _hardCap;
        softCap = _softCap;
        lockPeriod = _lockPeriod;
    }

    function getLatestETHPrice() public view returns (uint256) {
        (, int256 price, , , ) = ethUsdPriceFeed.latestRoundData();
        require(price != 0, "Invalid price feed data");
        return uint256(price);
    }

    function calculateETHAmount(
        uint256 usdAmount
    ) public view returns (uint256) {
        uint256 ethPrice = getLatestETHPrice();
        // Convert USD amount to ETH
        // Multiply by 1e18 (ETH decimals) and divide by price (with its 8 decimals)
        return (usdAmount * 1e18) / (ethPrice * 1e10); // 1e10 to adjust for price feed decimals
    }

    function buyWithUsdToken(
        address usdPaymentToken,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(
            usdPaymentToken == address(usdt) ||
                usdPaymentToken == address(usdc),
            "Invalid payment token"
        );
        uint256 utilityTokensAmt = (amount * 1e12) * presaleUsdPrice; // 1e12 to adjust for USD token decimals
        _processPurchase(usdPaymentToken, amount, utilityTokensAmt);
    }

    function buyWithNativeToken(uint256 amount) external payable nonReentrant {
        uint256 ethPrice = getLatestETHPrice();
        uint256 utilityTokensAmt = ((amount * 1e18) / ethPrice) * presaleUsdPrice;
        _processPurchase(address(0), amount, utilityTokensAmt);
    }

    function _processPurchase(
        address paymentCurrency,
        uint paymentAmt,
        uint256 amount
    ) private {
        require(block.timestamp >= presaleStartTime, "Presale not started");
        require(block.timestamp <= presaleEndTime, "Presale ended");
        require(!presaleFinalized, "Presale finalized");
        require(amount >= minPurchase, "Below min purchase");
        require(amount <= maxPurchase, "Exceeds max purchase");

        require(totalSold + amount <= hardCap, "Would exceed hard cap");
        require(
            utilityTokenPurchases[msg.sender][paymentCurrency].tokenAmount + amount <=
                maxPurchase,
            "Would exceed max purchase"
        );

        if (paymentCurrency == address(0)) {
            require(msg.value == paymentAmt, "Incorrect payment amount");
        } else {
            require(
                IERC20(paymentCurrency).balanceOf(msg.sender) >= paymentAmt,
                "Insufficient balance"
            );
            // Transfer payment tokens
            IERC20(paymentCurrency).safeTransferFrom(
                    msg.sender,
                    address(this),
                    paymentAmt
                );
        }

        // Update state
        totalSold += amount;
        
        utilityTokenPurchases[msg.sender][paymentCurrency].tokenAmount += amount;
        utilityTokenPurchases[msg.sender][paymentCurrency].paymentAmount += paymentAmt;
        utilityTokenPurchases[msg.sender][paymentCurrency].unlockTime = block.timestamp + lockPeriod;


        emit TokensPurchased(msg.sender, paymentCurrency, paymentAmt, amount);
    }

    function adminWithdrawRemainingUtilityTokens() external onlyOwner payable {
        require(presaleFinalized, "Presale not finalized");
        uint256 balance = utilityToken.balanceOf(address(this));
        require(balance != 0, "No tokens to withdraw");
        
        utilityToken.safeTransfer(owner(), balance);
        
    }

    function adminWithdrawRaisedFundsNativeTokens() external onlyOwner payable {
        require(presaleFinalized, "Presale not finalized");
        require(totalSold >= softCap, "SoftCap not reached");
        uint256 balance = address(this).balance;
        require(balance != 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    function adminWithdrawRaisedFundsERC20Tokens(address tokenAddress) external onlyOwner payable {
        require(presaleFinalized, "Presale not finalized");
        require(totalSold >= softCap, "SoftCap not reached");
        uint256 balance = IERC20(tokenAddress).balanceOf(address(this));
        require(balance != 0, "No funds to withdraw");
        IERC20(tokenAddress).safeTransfer(owner(),balance);
    }

    function finalizePresale() external onlyOwner payable{
        require(block.timestamp > presaleEndTime, "Presale not ended");
        require(!presaleFinalized, "Presale already finalized");
        require (totalSold >= softCap, "SoftCap not reached");
        presaleFinalized = true;
        emit PresaleFinalized(totalSold);
        
    }

    function pausePresale() external onlyOwner payable{
        _pause();
    }

    function unpausePresale() external onlyOwner payable{
        _unpause();
    }

    function withdrawPurchasedUtilityTokens(address paymentCurrency) external whenNotPaused{
        require(presaleFinalized, "Presale not finalized");
        require(totalSold > softCap, "SoftCap not reached");
        uint256 balance = utilityTokenPurchases[msg.sender][paymentCurrency].tokenAmount;
        require(balance != 0, "No tokens to withdraw");
        require(utilityTokenPurchases[msg.sender][paymentCurrency].unlockTime < block.timestamp, "Tokens are locked");
        utilityToken.safeTransfer(msg.sender, balance);
        utilityTokenPurchases[msg.sender][paymentCurrency].tokenAmount = 0;

    }

    function withdrawSentTokensIfSoftCapNotreached(address paymentCurrencyAddress) external whenNotPaused{
        require(presaleFinalized, "Presale not finalized");
        require(totalSold < softCap, "SoftCap not reached");
        uint256 balance = utilityTokenPurchases[msg.sender][paymentCurrencyAddress].paymentAmount;
        require(balance != 0, "No tokens to withdraw");
        utilityTokenPurchases[msg.sender][paymentCurrencyAddress].paymentAmount = 0;
        if (address(paymentCurrencyAddress) == address(0)) {
            payable(msg.sender).transfer(balance);

        } else {
            IERC20(paymentCurrencyAddress).safeTransfer(msg.sender,balance);
        }
        
    }

    function getPurchasedBalance(
        address buyer,
        address paymentCurrency
    ) external view returns (uint256, uint256, uint256) {
        return (
        utilityTokenPurchases[buyer][paymentCurrency].paymentAmount, 
        utilityTokenPurchases[buyer][paymentCurrency].tokenAmount, 
        utilityTokenPurchases[buyer][paymentCurrency].unlockTime);
    }
    
}
