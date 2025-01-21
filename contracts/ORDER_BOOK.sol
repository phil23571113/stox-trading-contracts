//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Orderbook is Ownable2Step, ReentrancyGuard, Pausable {
    //using SafeMath for uint256;
    IERC20 currencyToken;
    IERC20 securityToken;

    // Order struct containing price, quantity, and date created
    struct Order {
        uint256 price;
        uint256 quantity;
        uint256 date;
    }

    // mapping of buyer address to buy order
    mapping(address => Order) buyOrders;

    // mapping used to preserve order based on buy price
    mapping(address => address) nextBuy;

    // overall buy order count
    uint256 public buyCount;

    // mapping of seller address to sell order
    mapping(address => Order) sellOrders;

    // mapping used to preserve order based on sell price
    mapping(address => address) nextSell;

    // overall sell order count
    uint256 public sellCount;

    // BUFFER used to signal beginning and end of order mappings
    address constant BUFFER = address(1);

    // mapping used for storing the outstanding balances of executed transactions securities
    mapping(address => uint256) securitiesBalance;

    // mapping used for storing the outstanding balances of executed transactions currency
    mapping(address => uint256) currenciesBalance;

    // Maximum safe value for the price of an order
    uint256 constant MAX_INT = 2**255 - 1;

    // event emitted whenever a buy order is placed
    event BuyOrderPlaced(
        uint256 indexed price,
        uint256 quantity,
        address indexed buyer
    );

    // event emitted whenever a buy order is cancelled
    event CancelBuyOrder(address indexed buyer);

    // event emitted whenever a sell order is placed
    event SellOrderPlaced(
        uint256 indexed price,
        uint256 quantity,
        address indexed seller
    );

    // event emitted whenever a sell order is cancelled
    event CancelSellOrder(address indexed seller);

    // event emitted whenever a buy and sell order match
    event Execution(uint256 indexed price, uint256 quantity);

    // Events for pause/unpause logging
    event OrderbookPaused(address indexed owner);
    event OrderbookUnpaused(address indexed owner);

    constructor(address _currencyToken, address _securityToken)
        payable
        Ownable(msg.sender)
    {
        require(_currencyToken != address(0), "Invalid currency token");
        require(_securityToken != address(0), "Invalid security token");

        currencyToken = IERC20(_currencyToken);
        securityToken = IERC20(_securityToken);

        // initialize order mappings
        nextBuy[BUFFER] = BUFFER;
        nextSell[BUFFER] = BUFFER;
    }

    // Pause/unpause functions
    function pauseOrderBook() external onlyOwner {
        _pause();
        emit OrderbookPaused(msg.sender);
    }

    function unpauseOrderBook() external onlyOwner {
        _unpause();
        emit OrderbookUnpaused(msg.sender);
    }

    // Emergency withdrawal function for owner
    function emergencyWithdraw(
        IERC20 token,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(
            token == currencyToken || token == securityToken,
            "Invalid token"
        );
        require(token.transfer(to, amount), "Transfer failed");
    }

    /* Helper function used to verify the correct insertion position of a
     * buy order when it is added to the buy side. Returns true if the order is
     * at least as expensive as the previous buy order in the list and definitely
     * more expensive than the next order in the list (for descending order)
     */
    function _verifyIndexBuy(
        address prev,
        uint256 price,
        address next
    ) internal view returns (bool) {
        return ((prev == BUFFER || price <= buyOrders[prev].price) &&
            (next == BUFFER || price > buyOrders[next].price));
    }

    /* Helper function used to verify the correct insertion position of a
     * sell order when it is added to the sell side. Returns true if the order is
     * at least as cheap as the previous sell order in the list and definitely
     * less expensive than the next order in the list (for ascending order)
     */
    function _verifyIndexSell(
        address prev,
        uint256 price,
        address next
    ) internal view returns (bool) {
        return ((prev == BUFFER || price >= sellOrders[prev].price) &&
            (next == BUFFER || price < sellOrders[next].price));
    }

    /* Helper function that finds the previous buy order address for the new buy
     * order to add to the list based on the new buy order price.
     */
    function _findPrevBuy(uint256 price)
        internal
        view
        returns (address prevBuyOrderAddr)
    {
        address prev = BUFFER;
        while (true) {
            if (_verifyIndexBuy(prev, price, nextBuy[prev])) {
                return prev;
            }
            prev = nextBuy[prev];
        }
    }

    /* Helper function that finds the previous sell order address for the new
     * sell order to add to the list based on the new sell order price.
     */
    function _findPrevSell(uint256 price)
        internal
        view
        returns (address prevSellOrderAddr)
    {
        address prev = BUFFER;
        while (true) {
            if (_verifyIndexSell(prev, price, nextSell[prev])) {
                return prev;
            }
            prev = nextSell[prev];
        }
    }

    /* Finds the previous address of the target address in the order mapping of
     * either buy or sell order addresses. Used for removing buy or sell orders.
     */

    function _getPreviousSell(address target)
        internal
        view
        returns (address prevAddr)
    {
        address current = BUFFER;
        while (nextSell[current] != BUFFER) {
            if (nextSell[current] == target) {
                return current;
            }
            current = nextSell[current];
        }
    }

    function _getPreviousBuy(address target)
        internal
        view
        returns (address prevAddr)
    {
        address current = BUFFER;
        while (nextBuy[current] != BUFFER) {
            if (nextBuy[current] == target) {
                return current;
            }
            current = nextBuy[current];
        }
    }

    // Update the withdrawable securities balance after an execution
    function _updateSecuritiesBalance(address receiver, uint256 amount)
        private
    {
        //securitiesBalance[receiver] += amount;
        securitiesBalance[receiver] = 
            securitiesBalance[receiver]+
            amount
        ;
    }

    // Update the withdrawable currencies balance after an execution
    function _updateCurrenciesBalance(address receiver, uint256 amount)
        private
    {
        //currenciesBalance[receiver] += amount;
        currenciesBalance[receiver] =currenciesBalance[receiver] + amount;
    }

    // Allow the client to withdraw his securities after an execution
    function withdrawSecurities() public nonReentrant {
        uint256 amount = securitiesBalance[msg.sender];
        require(amount != 0, "Amount should be positive");
        securitiesBalance[msg.sender] = 0;
        require(
            securityToken.transfer(msg.sender, amount),
            "Security transfer failed"
        );
    }

    // Allow the client to withdraw his securities after an execution
    function withdrawCurrencies() public nonReentrant {
        uint256 amount = currenciesBalance[msg.sender];
        require(amount != 0, "Amount should be positive");
        currenciesBalance[msg.sender] = 0;
        require(
            currencyToken.transfer(msg.sender, amount),
            "Currency transfer failed"
        );
    }

    function getWithdrawableSecurities() public view returns (uint256 amount) {
        return securitiesBalance[msg.sender];
    }

    function getWithdrawableCurrencies() public view returns (uint256 amount) {
        return currenciesBalance[msg.sender];
    }

    function getTotalDepositedSecurities()
        public
        view
        returns (uint256 amount)
    {
        return IERC20(securityToken).balanceOf(address(this));
    }

    function getTotalDepositedCurrencies()
        public
        view
        returns (uint256 amount)
    {
        return IERC20(currencyToken).balanceOf(address(this));
    }

    // Places a buy order and locks associated collateral
    function placeBuy(uint256 _price, uint256 _quantity)
        external
        nonReentrant
        whenNotPaused
    {


        require(_price <= MAX_INT, "Price too large for safe conversion");
        // Only one buy order per address
        require(
            buyOrders[msg.sender].date == 0,
            "First delete existing buy order"
        );
        require(
            _price != 0 && _quantity != 0,
            "Must have nonzero price and quantity"
        );

        uint256 allowance = currencyToken.allowance(msg.sender, address(this));
        require(
            allowance >= (_quantity * uint256(_price)) / 1e18,
            "Allowance is too low"
        );

        // Create a new order in the buy order mapping for msg.sender
        buyOrders[msg.sender] = Order(_price, _quantity, block.timestamp);

        /* Add msg.sender into the appropriate position in the ordering mapping.
         * This is similar to linked list insertion
         */
        address prev = _findPrevBuy(_price);
        address temp = nextBuy[prev];
        nextBuy[prev] = msg.sender;
        nextBuy[msg.sender] = temp;

        // Increment the overall buy count
        buyCount++;

        /* Transfer the buy order quantity of token1 from the buyer to the
         * orderbook contract. This locks the associated collateral
         */
        uint256 currencyValue = (_quantity * _price) / 1e18;

        require(currencyValue > 0, "Cash value must be non decimal");

        require(
            currencyToken.transferFrom(
                msg.sender,
                address(this),
                currencyValue
            ),
            "Currency transfer failed"
        );

        // Emit buy order placed event
        emit BuyOrderPlaced(_price, _quantity, msg.sender);

        _checkBuyExecution();
    }

    /*  Adds a BUY order after a transaction has been partially executed.
     *  No collateral is transferred because it was already transferred when sending the original order
     */

    function _addBuy(
        address _buyer,
        uint256 _price,
        uint256 _quantity
    ) private {
        // Only striclty positive price are accepted
        require(_price > 0, "Price must be strictly positive");

        // Only one buy order per address
        require(buyOrders[_buyer].date == 0, "First delete existing buy order");
        require(
            _price != 0 && _quantity != 0,
            "Must have nonzero pice and quantity"
        );

        // Create a new order in the buy order mapping for _buyer
        buyOrders[_buyer] = Order(_price, _quantity, block.timestamp);

        /* Add _buyer into the appropriate position in the ordering mapping.
         * This is similar to linked list insertion
         */
        address prev = _findPrevBuy(_price);
        address temp = nextBuy[prev];
        nextBuy[prev] = _buyer;
        nextBuy[_buyer] = temp;

        // Increment the overall buy count
        buyCount++;

        /* Transfer the buy order quantity of token1 from the buyer to the
         * orderbook contract. This locks the associated collateral
         */
        //currencyToken.transferFrom(msg.sender, address(this), _quantity);

        // Emit buy order placed event
        // emit BuyOrderPlaced(_price, _quantity, msg.sender);
    }

    // Cancels the buy order associated with msg.sender if it exists
    function cancelBuy() external nonReentrant whenNotPaused {
        require(
            buyOrders[msg.sender].date != 0,
            "Buy order must already exist"
        );

        uint256 buyPrice = buyOrders[msg.sender].price;

        // Store quantity of buy order to refund msg.sender with correct amount
        uint256 quantity = buyOrders[msg.sender].quantity;

        // Find the previous address of the msg.sender in the ordering mapping
        address prev = _getPreviousBuy(msg.sender);

        // Delete msg.sender from ordering mapping. Similar to linked list deletion
        nextBuy[prev] = nextBuy[msg.sender];

        // Delete buy order from buy order mapping and ordering mapping
        delete nextBuy[msg.sender];
        delete buyOrders[msg.sender];

        // Decrement the buy count
        buyCount--;

        // Unlock associated collateral and send it back to msg.sender
        uint256 currencyValue = 
            quantity * buyPrice/
            1e18
        ;

        require(
            currencyToken.transfer(msg.sender, currencyValue),
            "Currency transfer failed"
        );

        // Emit a cancel buy order event
        emit CancelBuyOrder(msg.sender);
    }

    // Places a sell order and locks associated collateral
    function placeSell(uint256 _price, uint256 _quantity)
        external
        nonReentrant
        whenNotPaused
    {

        require(_price <= MAX_INT, "Price too large for safe conversion");

        // Only one sell order per address
        require(
            sellOrders[msg.sender].date == 0,
            "First delete existing sell order"
        );
        require(
            _price != 0 && _quantity != 0,
            "Must have nonzero price and quantity"
        );

        uint256 allowance = securityToken.allowance(msg.sender, address(this));
        require(allowance >= _quantity, "Allowance is too low");

        // Create a new order in the sell order mapping for msg.sender
        sellOrders[msg.sender] = Order(_price, _quantity, block.timestamp);

        /* Add msg.sender into the appropriate position in the ordering mapping.
         * This is similar to linked list insertion
         */
        address prev = _findPrevSell(_price);
        address temp = nextSell[prev];
        nextSell[prev] = msg.sender;
        nextSell[msg.sender] = temp;

        // Increment the sell count
        sellCount++;

        /* Transfer the sell order quantity of securityToken from the seller to the
         * orderbook contract. This locks the associated collateral
         */
        require(
            securityToken.transferFrom(msg.sender, address(this), _quantity),
            "Security transfer failed"
        );

        // Emit a sell order placed event
        emit SellOrderPlaced(_price, _quantity, msg.sender);

        _checkSellExecution();
    }

    /*  Adds a SELL order after a transaction has been partially executed.
     *  No collateral is transferred because it was already transferred when sending the original order
     */

    function _addSell(
        address _seller,
        uint256 _price,
        uint256 _quantity
    ) private {
        // Only striclty positive price are accepted

        require(_price > 0, "Price must be strictly positive");

        // Only one sell order per address
        require(
            sellOrders[_seller].date == 0,
            "First delete existing sell order"
        );
        require(
            _price != 0 && _quantity != 0,
            "Must have nonzero pice and quantity"
        );

        // Create a new order in the sell order mapping for _seller
        sellOrders[_seller] = Order(_price, _quantity, block.timestamp);

        /* Add _seller into the appropriate position in the ordering mapping.
         * This is similar to linked list insertion
         */
        address prev = _findPrevSell(_price);
        address temp = nextSell[prev];
        nextSell[prev] = _seller;
        nextSell[_seller] = temp;

        // Increment the sell count
        sellCount++;

        /* Transfer the sell order quantity of securityToken from the seller to the
         * orderbook contract. This locks the associated collateral
         */
        //securityToken.transferFrom(msg.sender, address(this), _quantity);

        // Emit a sell order placed event
        //emit SellOrderPlaced(_price, _quantity, msg.sender);
    }

    // Cancels the sell order associated with msg.sender if it exists
    function cancelSell() external nonReentrant whenNotPaused {
        require(
            sellOrders[msg.sender].date != 0,
            "Sell order must already exist"
        );

        // Store quantity of sell order to refund msg.sender with correct amount
        uint256 quantity = sellOrders[msg.sender].quantity;

        // Find the previous address of the msg.sender in the ordering mapping
        address prev = _getPreviousSell(msg.sender);

        // Delete msg.sender from ordering mapping. Similar to linked list deletion
        nextSell[prev] = nextSell[msg.sender];

        // Delete sell order from sell order mapping and ordering mapping
        delete nextSell[msg.sender];
        delete sellOrders[msg.sender];

        // Decrement sell count
        sellCount--;

        // Unlock associated collateral and send it back to msg.sender
        require(
            securityToken.transfer(msg.sender, quantity),
            "Security transfer failed"
        );

        // Emit a cancel sell order event
        emit CancelSellOrder(msg.sender);
    }

    function _removeSell(address sellerAddr) internal {
        // Store quantity of sell order to refund sellerAddr with correct amount
        //uint256 quantity = sellOrders[sellerAddr].quantity;

        address nextSeller = nextSell[sellerAddr];

        // Find the previous address of the sellerAddr in the ordering mapping
        address prev = _getPreviousSell(sellerAddr);

        // Delete sellerAddr from ordering mapping. Similar to linked list deletion
        nextSell[prev] = nextSell[sellerAddr];

        // Delete sell order from sell order mapping and ordering mapping
        delete nextSell[sellerAddr];
        delete sellOrders[sellerAddr];

        // Decrement sell count
        sellCount--;

        nextSell[BUFFER] = nextSeller;

        // Unlock associated collateral and send it back to msg.sender
        // securityToken.transfer(msg.sender, quantity);

        // Emit a cancel sell order event
        //emit CancelSellOrder(msg.sender);
    }

    function _removeBuy(address buyerAddr) internal {
        // Store quantity of buy order to refund msg.sender with correct amount
        //uint256 quantity = buyOrders[buyerAddr].quantity;

        // Store the next buyer in the linked list before removal
        address nextBuyer = nextBuy[buyerAddr];

        // Find the previous address of the buyerAddr in the ordering mapping
        address prev = _getPreviousBuy(buyerAddr);

        // Delete buyerAddr from ordering mapping. Similar to linked list deletion
        nextBuy[prev] = nextBuy[buyerAddr];

        // Delete buy order from buy order mapping and ordering mapping
        delete nextBuy[buyerAddr];
        delete buyOrders[buyerAddr];

        // Decrement the buy count
        buyCount--;

        // Update the BUFFER to point to the next buyer
        nextBuy[BUFFER] = nextBuyer; // Update BUFFER to next valid buyer

        // Unlock associated collateral and send it back to msg.sender
        // currencyToken.transfer(msg.sender, quantity);

        // Emit a cancel buy order event
        //emit CancelBuyOrder(msg.sender);
    }

    /* Returns the buy side of the orderbook in three separate arrays. The first
     * array contains all the addresses with active buy orders, and the second
     * and third arrays contain the associated prices and quantities of these
     * buy orders respectively. Arrays are returned in descending order
     */
    function getBuySide()
        external
        view
        returns (
            address[] memory,
            uint256[] memory,
            uint256[] memory
        )
    {
        // Instantiate three arrays equal in length to the total buy count
        address[] memory addressTemp = new address[](buyCount);
        uint256[] memory priceTemp = new uint256[](buyCount);
        uint256[] memory quantityTemp = new uint256[](buyCount);

        // Set current address equal to the first buy order address
        address current = nextBuy[BUFFER];

        // Iterate through each array and store the corresponding values
        for (uint256 i = 0; i < addressTemp.length; i++) {
            addressTemp[i] = current;
            Order storage order = buyOrders[current];

            priceTemp[i] = order.price;
            quantityTemp[i] = order.quantity;

            current = nextBuy[current];
        }

        // Return the three arrays
        return (addressTemp, priceTemp, quantityTemp);
    }

    /* Returns the sell side of the orderbook in three separate arrays. The first
     * array contains all the addresses with active sell orders, and the second
     * and third arrays contain the associated prices and quantities of these
     * sell orders respectively. Arrays are returned in ascending order
     */
    function getSellSide()
        external
        view
        returns (
            address[] memory,
            uint256[] memory,
            uint256[] memory
        )
    {
        // Instantiate three arrays equal in length to the total sell count
        address[] memory addressTemp = new address[](sellCount);
        uint256[] memory priceTemp = new uint256[](sellCount);
        uint256[] memory quantityTemp = new uint256[](sellCount);

        // Set current address equal to the first sell order address
        address current = nextSell[BUFFER];

        // Iterate through each array and store the corresponding values
        for (uint256 i = 0; i < addressTemp.length; i++) {
            addressTemp[i] = current;
            Order storage order = sellOrders[current];

            priceTemp[i] = order.price;
            quantityTemp[i] = order.quantity;

            current = nextSell[current];
        }

        // Return the three arrays
        return (addressTemp, priceTemp, quantityTemp);
    }

    /* Returns the spread of the orderbook defined as the absolute value of the
     * difference between the highest buy price and the lowest sell price.
     */
    function getSpread()
        public
        view
        returns (
            uint256 bestBuy,
            uint256 bestBuyQty,
            uint256 bestBuyDate,
            uint256 bestSell,
            uint256 bestSellQty,
            uint256 bestSellDate
        )
    {
        uint256 _bestSell = sellOrders[nextSell[BUFFER]].price;
        uint256 _bestBuy = buyOrders[nextBuy[BUFFER]].price;
        uint256 _bestSellQty = sellOrders[nextSell[BUFFER]].quantity;
        uint256 _bestBuyQty = buyOrders[nextBuy[BUFFER]].quantity;
        uint256 _bestSellDate = sellOrders[nextSell[BUFFER]].date;
        uint256 _bestBuyDate = buyOrders[nextBuy[BUFFER]].date;

        return (
            _bestBuy,
            _bestBuyQty,
            _bestBuyDate,
            _bestSell,
            _bestSellQty,
            _bestSellDate
        );
    }

    function _checkSellExecution() internal {
        (
            uint256 bestBuyPx,
            uint256 bestBuyQty,
            ,
            uint256 bestSellPx,
            uint256 bestSellQty,

        ) = getSpread();
        if (bestSellPx == 0 || bestBuyPx == 0) {
            return;
        }

        int256 spread = int256(bestSellPx) - int256(bestBuyPx);

        if (spread <= 0) {
            // uint256 executionQty = _bestBuyQty > _bestSellQty ? _bestBuyQty - _bestSellQty : _bestSellQty - _bestBuyQty;
            uint256 executionQty;
            uint256 executionPx;

            executionPx = bestSellPx;

            address buyer = nextBuy[BUFFER];
            address seller = nextSell[BUFFER];

            if (bestBuyQty == bestSellQty) {
                // The execution quantity can be either the best buy or sell qty
                executionQty = bestBuyQty;

                // Remove the SELL and BUY orders from the Order Book
                _removeSell(seller);
                _removeBuy(buyer);

                // Update the balance of withdrawable currencies
                _updateCurrenciesBalance(
                    seller,
                    executionQty * executionPx / 1e18
                );

                // Update the balance of withdrawable securities
                _updateSecuritiesBalance(buyer, executionQty);

                emit Execution(executionPx, executionQty);
            } else if (bestBuyQty > bestSellQty) {
                executionQty = bestSellQty;

                // uint256 remaingQuantity = bestBuyQty - bestSellQty; replace by safemath
                uint256 remaingQuantity =bestBuyQty - bestSellQty;

                // Remove the SELL and BUY orders from the Order Book
                _removeSell(seller);
                _removeBuy(buyer);

                // Update the balance of withdrawable currencies
                _updateCurrenciesBalance(
                    seller,
                    (executionQty * uint256(executionPx)) / 1e18
                );

                // Update the balance of withdrawable securities
                _updateSecuritiesBalance(buyer, executionQty);

                emit Execution(executionPx, executionQty);

                // Insert a BUY order of the remaining quantity as it has not been fully executed
                _addBuy(buyer, bestBuyPx, remaingQuantity);
            } else {
                executionQty = bestBuyQty;

                // uint256 remaingQuantity = bestSellQty - bestBuyQty; replace by safemath

                uint256 remaingQuantity = bestSellQty - bestBuyQty;

                // Remove the SELL and BUY orders from the Order Book
                _removeSell(seller);
                _removeBuy(buyer);

                // Update the balance of withdrawable currencies

                uint256 withdrawalbleCurrencies = 
                    executionQty * executionPx /
                    1e18
                ;

                _updateCurrenciesBalance(seller, withdrawalbleCurrencies);

                // Update the balance of withdrawable securities
                _updateSecuritiesBalance(buyer, executionQty);

                emit Execution(executionPx, executionQty);

                // Insert a SELL order as it has not been fully executed
                _addSell(seller, bestSellPx, remaingQuantity);

                // Check again the order book in case the remaining quantity can be executed against
                _checkSellExecution();
            }
        }
    }

    function _checkBuyExecution() internal {
        (
            uint256 bestBuyPx,
            uint256 bestBuyQty,
            ,
            uint256 bestSellPx,
            uint256 bestSellQty,

        ) = getSpread();
        if (bestSellPx == 0 || bestBuyPx == 0) {
            return;
        }
        uint256 spread = bestSellPx - bestBuyPx;

        if (spread <= 0) {
            uint256 executionQty;
            uint256 executionPx;

            executionPx = bestBuyPx;

            address buyer = nextBuy[BUFFER];
            address seller = nextSell[BUFFER];

            if (bestBuyQty == bestSellQty) {
                // The execution quantity can be either the best buy or sell qty
                executionQty = bestBuyQty;

                // Remove the SELL and BUY orders from the Order Book
                _removeSell(seller);
                _removeBuy(buyer);

                // Update the balance of withdrawable currencies
                _updateCurrenciesBalance(
                    seller,
                    (executionQty * uint256(executionPx)) / 1e18
                );

                // Update the balance of withdrawable securities
                _updateSecuritiesBalance(buyer, executionQty);

                emit Execution(executionPx, executionQty);
            } else if (bestBuyQty > bestSellQty) {
                executionQty = bestSellQty;

                uint256 remaingQuantity = bestBuyQty - bestSellQty;

                // Remove the SELL and BUY orders from the Order Book
                _removeSell(seller);
                _removeBuy(buyer);

                // Update the balance of withdrawable currencies
                uint256 currencyValue = 
                    executionQty * executionPx /
                    1e18
                ;

                _updateCurrenciesBalance(seller, currencyValue);

                // Update the balance of withdrawable securities
                _updateSecuritiesBalance(buyer, executionQty);

                emit Execution(executionPx, executionQty);

                // Insert a BUY order of the remaining quantity as it has not been fully executed
                _addBuy(buyer, bestBuyPx, remaingQuantity);

                // Check again the order book in case the remaining quantity can be executed against
                _checkBuyExecution();
            } else {
                executionQty = bestBuyQty;

                uint256 remaingQuantity = bestSellQty - bestBuyQty;

                // Remove the SELL and BUY orders from the Order Book
                _removeSell(seller);
                _removeBuy(buyer);

                // Update the balance of withdrawable currencies

                uint256 currencyValue = 
                    executionQty * executionPx /
                    1e18
                ;

                _updateCurrenciesBalance(seller, currencyValue);

                // Update the balance of withdrawable securities
                _updateSecuritiesBalance(buyer, executionQty);

                emit Execution(executionPx, executionQty);

                // Insert a SELL order as it has not been fully executed
                _addSell(seller, bestSellPx, remaingQuantity);
            }
        }
    }
}
