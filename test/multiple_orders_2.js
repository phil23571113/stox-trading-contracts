const { expect } = require('chai')
const { ethers } = require('hardhat');
const { BigNumber } = require("ethers");

let DEFAULT_TIMEOUT = 1000000

let SIGNERS

let STOXContract
let NVDAContract
let ORDERBOOKContract
let distributedAmount = ethers.parseUnits('100', 18) // 100 tokens with 18 decimals
let buyAmount = 10
let sellAmount = 10

/* Partial Execution from BUY */
let bestSellPrice = 10
let usedWalletNbForExecuteBestSell = 5
let partialBuyAmount = 7

/* Partial Execution from SELL */
let bestBuyPrice = 4
let usedWalletNbForExecuteBestBuy = 5
let partialSellAmount = 6

/* Add an order at an already existing price */
let usedWalletNbForSecondSameOrder = 6

/* Scenario when 1 order executes against 2 opposite orders with the same price */
let partialSellAmountAgainstTwo = 12
let usedWalletPartialSellAmountAgainstTwo = 7

describe('Retrieve Connected Signers', function () {
     it('retrieve the connected  signers', async function () {
        SIGNERS = await ethers.getSigners()
    }).timeout(DEFAULT_TIMEOUT)
})

describe('Deploy contracts', function () {
    it('should deploy the STOX token contract', async function () {
        this.STOXContractFactory = await ethers.getContractFactory('Stox')
        STOXContract = await this.STOXContractFactory.deploy()
        await STOXContract.waitForDeployment()
        console.log('STOX token deployed to:', STOXContract.address)
    }).timeout(DEFAULT_TIMEOUT)

    it('should deploy the NVDA security token contract', async function () {
        const amount = ethers.parseUnits('1000', 18)
        this.NVDAContractFactory = await ethers.getContractFactory(
            'NvidiaSecurity'
        )
        NVDAContract = await this.NVDAContractFactory.deploy(amount)
        await NVDAContract.waitForDeployment()
        console.log('NVDA token deployed to:', NVDAContract.address)
    }).timeout(DEFAULT_TIMEOUT)

    it('should deploy the Order Book contract', async function () {
        this.ORDERBOOKContractFactory = await ethers.getContractFactory(
            'Orderbook'
        )
        ORDERBOOKContract = await this.ORDERBOOKContractFactory.deploy(
            STOXContract.getAddress(),
            NVDAContract.getAddress()
        )
        await ORDERBOOKContract.waitForDeployment()
        console.log('Order Book deployed to:', await ORDERBOOKContract.getAddress())
    }).timeout(DEFAULT_TIMEOUT)
})

describe('Distribute tokens', function () {
    it('should send 100 NVDA and 100 STOX tokens to 10 test wallets', async function () {
        for (let x = 1; x < 11; x++) {
            await NVDAContract.transfer(
                SIGNERS[x].address,
                distributedAmount
            )
            await STOXContract.transfer(
                SIGNERS[x].address,
                distributedAmount
            )
        }
    }).timeout(DEFAULT_TIMEOUT)

    it('should confirm the wallets received the STOX tokens', async function () {
        for (let x = 1; x < 6; x++) {
            const balance = await STOXContract.balanceOf(
                SIGNERS[x].address
            )
            console.log(
                `Wallet ${SIGNERS[x].address} STOX balance:`,
                ethers.formatUnits(balance, 18)
            )
            expect(balance.toString()).to.equal(distributedAmount.toString())
        }
    }).timeout(DEFAULT_TIMEOUT)

    it('should confirm the wallets received the NVDA tokens', async function () {
        for (let x = 1; x < 6; x++) {
            const balance = await NVDAContract.balanceOf(
                SIGNERS[x].address
            )
            console.log(
                `Wallet ${SIGNERS[x].address} NVDA balance:`,
                ethers.formatUnits(balance, 18)
            )
            expect(balance.toString()).to.equal(distributedAmount.toString())
        }
    }).timeout(DEFAULT_TIMEOUT)
})

describe('Fill order book with 4 BUY orders', function () {

    it('should approve the spending for 4 buy orders', async function () {
        for (let x = 1; x < 5; x++) {
            const buyCashAmount = buyAmount * x

            const buyCashAmountEth = ethers.parseUnits(
                buyCashAmount.toString(),
                18
            )

            const stoxContractForWallet = STOXContract.connect(SIGNERS[x])

            // Approve the ORDERBOOKContract to spend tokens on behalf of this wallet
            await stoxContractForWallet.approve(
                ORDERBOOKContract.getAddress(),
                buyCashAmountEth
            )

            // Verify approval (optional)
            const allowance = await STOXContract.allowance(
                SIGNERS[x].address,
                ORDERBOOKContract.getAddress()
            )
            console.log(
                `Wallet ${
                    SIGNERS[x].address
                } approved to spend ${ethers.formatUnits(
                    allowance,
                    18
                )} STOX tokens for ORDERBOOKContract`
            )

            // Add assertions if needed
            expect(allowance.toString()).to.equal(buyCashAmountEth.toString())
        }
    }).timeout(DEFAULT_TIMEOUT)

    it('should submit 4 buy orders to fill the order book with incremental prices', async function () {
        for (let x = 1; x < 5; x++) {
            const buyAmountEth = ethers.parseUnits(
                buyAmount.toString(),
                18
            )
            const buyPriceEth = ethers.parseUnits(x.toString(), 18)

            const orderBookContractForWallet = ORDERBOOKContract.connect(
                SIGNERS[x]
            )

            // Send the buy order on behalf of this wallet
            await orderBookContractForWallet.placeBuy(buyPriceEth, buyAmountEth)
        }
    }).timeout(DEFAULT_TIMEOUT)

    it('should verify the output of getBuySide', async function () {
        // Call the getBuySide function
        const result = await ORDERBOOKContract.getBuySide()
        console.log(result)

        // Expected values
        const expectedAddresses = [
            SIGNERS[4].address,
            SIGNERS[3].address,
            SIGNERS[2].address,
            SIGNERS[1].address,
        ]

        const expectedAmounts = [
            ethers.getBigInt('4000000000000000000'),
            ethers.getBigInt('3000000000000000000'),
            ethers.getBigInt('2000000000000000000'),
            ethers.getBigInt('1000000000000000000'),
        ]

        const expectedPrices = [
            ethers.getBigInt('10000000000000000000'),
            ethers.getBigInt('10000000000000000000'),
            ethers.getBigInt('10000000000000000000'),
            ethers.getBigInt('10000000000000000000'),
        ]

        // Verify addresses
        expect(result[0]).to.deep.equal(expectedAddresses)

        // Verify amounts
        expect(result[1].map(String)).to.deep.equal(expectedAmounts.map(String))

        // Verify prices
        expect(result[2].map(String)).to.deep.equal(expectedPrices.map(String))
    }).timeout(DEFAULT_TIMEOUT)
})

describe('Fill order book with 4 SELL orders', function () {

    it('should approve the spending for 4 SELL orders', async function () {
        for (let x = 1; x < 5; x++) {
            const sellAmountEth = ethers.parseUnits(
                sellAmount.toString(),
                18
            )
            console.log('sellAmountEth', sellAmountEth)
            const nvdaContractForWallet = NVDAContract.connect(SIGNERS[x])

            // Approve the ORDERBOOKContract to spend tokens on behalf of this wallet
            await nvdaContractForWallet.approve(
                ORDERBOOKContract.getAddress(),
                sellAmountEth
            )

            // Verify approval (optional)
            const allowance = await NVDAContract.allowance(
                SIGNERS[x].address,
                ORDERBOOKContract.getAddress()
            )
            console.log(
                `Wallet ${
                    SIGNERS[x].address
                } approved to spend ${ethers.formatUnits(
                    allowance,
                    18
                )} NVDA tokens for ORDERBOOKContract`
            )

            // Add assertions if needed
            expect(allowance.toString()).to.equal(sellAmountEth.toString())
        }
    }).timeout(DEFAULT_TIMEOUT)

    it('should submit 4 sell orders (equal respectively to the double of the buy orders) to fill the order book with incremental prices', async function () {

        for (let x = 1; x < 5; x++) {
            // Define the sell price and amount
            const sellPriceEth = ethers.parseUnits(
                (x * 10).toString(),
                18
            ) // Incremental prices

            const sellAmountEth = ethers.parseUnits(
                sellAmount.toString(),
                18
            ) // Convert to 18 decimals

            // Connect the order book contract to the seller's account
            const orderBookContractForWallet = ORDERBOOKContract.connect(
                SIGNERS[x]
            )

            // Place the sell order (price first, then amount)
            const tx = await orderBookContractForWallet.placeSell(
                sellPriceEth,
                sellAmountEth
            )

            // Wait for the transaction to be mined
            // const receipt = await tx.wait()

            // Log the transaction result
            //console.log(`Sell order placed by ${SIGNERS[x].address}`)
            //console.log('Transaction receipt:', receipt)
        }
    }).timeout(DEFAULT_TIMEOUT)

    it('should verify the output of getSellSide', async function () {
        // Call the getBuySide function
        const result = await ORDERBOOKContract.getSellSide()
        console.log(result)

        // Expected values
        const expectedAddresses = [
            SIGNERS[1].address,
            SIGNERS[2].address,
            SIGNERS[3].address,
            SIGNERS[4].address,
        ]

        const expectedPrices = [
            ethers.getBigInt('10000000000000000000'),
            ethers.getBigInt('20000000000000000000'),
            ethers.getBigInt('30000000000000000000'),
            ethers.getBigInt('40000000000000000000'),
        ]

        const expectedAmounts = [
            ethers.getBigInt('10000000000000000000'),
            ethers.getBigInt('10000000000000000000'),
            ethers.getBigInt('10000000000000000000'),
            ethers.getBigInt('10000000000000000000'),
        ]

        // Verify addresses
        expect(result[0]).to.deep.equal(expectedAddresses)

        // Verify amounts
        expect(result[1].map(String)).to.deep.equal(expectedPrices.map(String))

        // Verify prices
        expect(result[2].map(String)).to.deep.equal(expectedAmounts.map(String))
    }).timeout(DEFAULT_TIMEOUT)
})



describe('Add a BUY order at the same level than an already existing one', function () {
    it('should approve the spending for one  buy orders ', async function () {
        

        const buyCashAmount = buyAmount * bestBuyPrice

        const buyCashAmountEth = ethers.parseUnits(
            buyCashAmount.toString(),
            18
        )

        const stoxContractForWallet = STOXContract.connect(
            SIGNERS[usedWalletNbForSecondSameOrder]
        )

        // Approve the ORDERBOOKContract to spend tokens on behalf of this wallet
        await stoxContractForWallet.approve(
            ORDERBOOKContract.getAddress(),
            buyCashAmountEth
        )

        // Verify approval (optional)
        const allowance = await STOXContract.allowance(
            SIGNERS[usedWalletNbForSecondSameOrder].address,
            ORDERBOOKContract.getAddress()
        )
        console.log(
            `Wallet ${SIGNERS[usedWalletNbForSecondSameOrder].address
            } approved to spend ${ethers.formatUnits(
                allowance,
                18
            )} STOX tokens for ORDERBOOKContract`
        )

        // Add assertions if needed
        expect(allowance.toString()).to.equal(buyCashAmountEth.toString())
    }).timeout(DEFAULT_TIMEOUT)

    it('should submit 1 buy orders to execute the best sell order', async function () {
        

        const buyAmountEth = ethers.parseUnits(buyAmount.toString(), 18)
        const buyPriceEth = ethers.parseUnits(
            bestBuyPrice.toString(),
            18
        )

        const orderBookContractForWallet = await ORDERBOOKContract.connect(
            SIGNERS[usedWalletNbForSecondSameOrder]
        )

        // Send the buy order on behalf of this wallet
        await orderBookContractForWallet.placeBuy(buyPriceEth, buyAmountEth)
    }).timeout(DEFAULT_TIMEOUT)

    it('should verify the output of getBuySide', async function () {
        // Call the getBuySide function
        const result = await ORDERBOOKContract.getBuySide()
        console.log(result)

        // Expected values
        const expectedAddresses = [
            SIGNERS[4].address,
            SIGNERS[usedWalletNbForSecondSameOrder].address,
            SIGNERS[3].address,
            SIGNERS[2].address,
            SIGNERS[1].address,
           
        ]

        const expectedPrices = [
            ethers.getBigInt('4000000000000000000'),
            ethers.getBigInt('4000000000000000000'),
            ethers.getBigInt('3000000000000000000'),
            ethers.getBigInt('2000000000000000000'),
            ethers.getBigInt('1000000000000000000'),
        ]

        const expectedAmounts = [
            ethers.getBigInt('10000000000000000000'),
            ethers.getBigInt('10000000000000000000'),
            ethers.getBigInt('10000000000000000000'),
            ethers.getBigInt('10000000000000000000'),
            ethers.getBigInt('10000000000000000000'),
        ]

        // Verify addresses
        expect(result[0]).to.deep.equal(expectedAddresses)

        // Verify amounts
        expect(result[1].map(String)).to.deep.equal(expectedPrices.map(String))

        // Verify prices
        expect(result[2].map(String)).to.deep.equal(expectedAmounts.map(String))
    }).timeout(DEFAULT_TIMEOUT)
})

describe('Fully execute one of the best BUY order and partially execute the other', function () {
    it('should approve the spending for one  SELL order that will partially execute the  best buy orders', async function () {

        const partialSellAmountEth = ethers.parseUnits(
            partialSellAmountAgainstTwo.toString(),
            18
        )

        const nvdaContractForWallet = NVDAContract.connect(
            SIGNERS[usedWalletPartialSellAmountAgainstTwo]
        )

        // Approve the ORDERBOOKContract to spend tokens on behalf of this wallet
        await nvdaContractForWallet.approve(
            ORDERBOOKContract.getAddress(),
            partialSellAmountEth
        )

        // Verify approval (optional)
        const allowance = await NVDAContract.allowance(
            SIGNERS[usedWalletPartialSellAmountAgainstTwo].address,
            ORDERBOOKContract.getAddress()
        )
        console.log(
            `Wallet ${SIGNERS[usedWalletPartialSellAmountAgainstTwo].address
            } approved to spend ${ethers.formatUnits(
                allowance,
                18
            )} NVDA tokens for ORDERBOOKContract`
        )

        // Add assertions if needed
        expect(allowance.toString()).to.equal(partialSellAmountEth.toString())
    }).timeout(DEFAULT_TIMEOUT)

    it('should submit 1 SELL orders to fully execute one of the best BUY order and partially execute the other', async function () {

        const partialSellAmountEth = ethers.parseUnits(
            partialSellAmountAgainstTwo.toString(),
            18
        )
        const sellPriceEth = ethers.parseUnits(
            bestBuyPrice.toString(),
            18
        )

        const orderBookContractForWallet = await ORDERBOOKContract.connect(
            SIGNERS[usedWalletPartialSellAmountAgainstTwo]
        )

        // Send the SELL order on behalf of this wallet
        await orderBookContractForWallet.placeSell(sellPriceEth, partialSellAmountEth)

    }).timeout(DEFAULT_TIMEOUT)

    it('should verify the output of getBuySide', async function () {
        // Call the getBuySide function
        const result = await ORDERBOOKContract.getBuySide()
        console.log(result)

        // Expected values
        const expectedAddresses = [
            SIGNERS[usedWalletNbForSecondSameOrder].address,
            SIGNERS[3].address,
            SIGNERS[2].address,
            SIGNERS[1].address,
            
        ]

        const expectedPrices = [
            ethers.getBigInt('4000000000000000000'),
            ethers.getBigInt('3000000000000000000'),
            ethers.getBigInt('2000000000000000000'),
            ethers.getBigInt('1000000000000000000'),
        ]

    /*  12 shares have been bought. 10 shares fully executed the first order, 
        and 2 shares partially executed the second one */

        const expectedAmounts = [
            ethers.getBigInt('8000000000000000000'), 
            ethers.getBigInt('10000000000000000000'),
            ethers.getBigInt('10000000000000000000'),
            ethers.getBigInt('10000000000000000000'),
        ]

        // Verify addresses
    expect(expectedAddresses).to.deep.equal(result[0])

        // Verify amounts
       expect(expectedPrices.map(String)).to.deep.equal(result[1].map(String))

        // Verify prices
        expect(expectedAmounts.map(String)).to.deep.equal(result[2].map(String))
    }).timeout(DEFAULT_TIMEOUT)
})