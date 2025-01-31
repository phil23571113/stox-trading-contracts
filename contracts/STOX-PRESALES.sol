//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.28;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import '@chainlink/contracts/src/v0.8/AutomationCompatibleInterface.sol';

contract PreSale is Ownable2Step, ReentrancyGuard, Pausable {
    IERC20 public utilityToken;
    IERC20 public nativeToken;
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

    TokenPurchase {
        address paymentCurrency;
        uint256 paymentAmount;
        uint256 tokenAmount;

    }

    mapping(address => TokenPurchase) public utilityTokenPurchases; 


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
        address _nativeToken,
        address _usdt,
        address _usdc,
        address _ethUsdPriceFeed,
        uint256 _presaleUsdPrice,
        uint256 _minPurchase,
        uint256 _maxPurchase,
        uint256 _presaleStartTime,
        uint256 _presaleEndTime,
        uint256 _softCap,
        uint256 _hardCap
    ) payable Ownable(msg.sender) {
        require(_utilityToken != address(0), "Invalid token address");
        require(_nativeToken != address(0), "Invalid token address");
        require(_usdt != address(0), "Invalid usdt address");
        require(_usdc != address(0), "Invalid usdc address");
        require(_presaleUsdPrice > 0, "Invalid price");
        require(_minPurchase > 0, "Invalid min purchase");
        require(_maxPurchase >= _minPurchase, "Invalid max purchase");
        require(_presaleStartTime > block.timestamp, "Invalid start time");
        require(_presaleEndTime > _presaleStartTime, "Invalid end time");
        require(_hardCap > 0, "Invalid hard cap");
        require(_hardCap > _softCap, "Invalid soft cap");

        utilityToken = IERC20(_utilityToken);
        nativeToken = IERC20(_nativeToken);
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
    }

    function getLatestETHPrice() public view returns (uint256) {
        (, int256 price, , , ) = ethUsdPriceFeed.latestRoundData();
        require(price > 0, "Invalid price feed data");
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
    ) external nonReentrant {
        require(
            usdPaymentToken == address(usdt) ||
                usdPaymentToken == address(usdc),
            "Invalid payment token"
        );
        uint256 utilityTokensAmt = (amount * 1e18) * presaleUsdPrice;
        _processPurchase(usdPaymentToken, usdPaymentAmt, utilityTokensAmt);
    }

    function buyWithNativeToken(
        address paymentToken,
        uint256 amount
    ) external payable nonReentrant {
        require(paymentToken == address(nativeToken), "Invalid payment token");
        uint256 ethPrice = getLatestETHPrice();
        uint256 utilityTokensAmt = ((amount * 1e18) / ethPrice) * presaleUsdPrice;
        _processPurchase(paymentToken, paymentAmt, utilityTokensAmt);
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
            utilityTokenPurchases[msg.sender].paymentAmount  + amount <= maxPurchase,
            "Would exceed max purchase"
        );

        // Transfer payment tokens
        require(
            IERC20(paymentCurrency).transferFrom(
                msg.sender,
                address(this),
                paymentAmt
            ),
            "Payment transfer failed"
        );

        // Update state
        totalSold += amount;
        utilityTokenPurchases[msg.sender].paymentAmount += amount;
        


        emit TokensPurchased(msg.sender, paymentCurrency, amount, tokenAmount);
    }

    function adminWithdrawRemainingUtilityTokens() external onlyOwner {
        require(presaleFinalized, "Presale not finalized");
        uint256 balance = nativeToken.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        require(
            nativeToken.transfer(owner(), balance),
            "Token transfer failed"
        );
    }

    function finalizePresale() external onlyOwner {
        require(block.timestamp > presaleEndTime, "Presale not ended");
        require(!presaleFinalized, "Presale already finalized");

        if (totalSold >= softCap) {
            presaleFinalized = true;
            emit PresaleFinalized(totalSold);
        }
    }

    function pausePresale() external onlyOwner {
        _pause();
    }

    function unpausePresale() external onlyOwner {
        _unpause();
    }

    function withdrawSoldUtilityTokens() external {
        require(presaleFinalized, "Presale not finalized");
        require(totalSold > softCap, "SoftCap not reached");
        uint256 balance = utilityTokenPurchases[msg.sender].tokenAmount;
        require(balance > 0, "No tokens to withdraw");
        require(
            utilityToken.transfer(msg.sender, balance),
            "Token transfer failed"
        );
    }

    function withdrawSentTokens() external {
        require(presaleFinalized, "Presale not finalized");
        require(totalSold < softCap, "SoftCap not reached");
        uint256 balance = utilityTokenPurchases[msg.sender].paymentAmount;
        require(balance > 0, "No tokens to withdraw");
        require(
            IERC20(utilityTokenPurchases[msg.sender].paymentCurrency).transfer(msg.sender, balance),
            "Token transfer failed"
        );
    }
}
