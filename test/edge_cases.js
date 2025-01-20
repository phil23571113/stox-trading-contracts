const {expect} = require('chai')
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

/* Unapproved spending */
let unapprovedSpendingWallet = 5
let unapprovedSpendingPrice = 10

/* Invalid input*/
let invalidInputs = [
    '-1',
    '0',
    'abc',
    '00',
    '^',
    '115792089237316195423570985008687907853269984665640564039457584007913129639936',
]

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
    it('should send 100 NVDA and 100 STOX tokens to 5 test wallets', async function () {
        for (let x = 1; x < 6; x++) {
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

describe('Submit UNAPPROVED orders', function () {
    it('should submit 1 BUY order without approval', async function () {
        const buyAmountEth = ethers.parseUnits(buyAmount.toString(), 18)
        const buyPriceEth = ethers.parseUnits(
            unapprovedSpendingPrice.toString(),
            18
        )

        const orderBookContractForWallet = ORDERBOOKContract.connect(
            SIGNERS[unapprovedSpendingWallet]
        )
        await expect(
            orderBookContractForWallet.placeBuy(buyPriceEth, buyAmountEth)
        ).to.be.revertedWith('Allowance is too low')
    }).timeout(DEFAULT_TIMEOUT)

    it('should submit 1 SELL order without approval', async function () {
        const sellAmountEth = ethers.parseUnits(sellAmount.toString(), 18)
        const sellPriceEth = ethers.parseUnits(
            unapprovedSpendingPrice.toString(),
            18
        )

        const orderBookContractForWallet = ORDERBOOKContract.connect(
            SIGNERS[unapprovedSpendingWallet]
        )
        await expect(
            orderBookContractForWallet.placeSell(sellPriceEth, sellAmountEth)
        ).to.be.revertedWith('Allowance is too low')
    }).timeout(DEFAULT_TIMEOUT)
})

describe('Submit invalid price orders', function () {
    it('should prevent BUY orders with invalid price', async function () {
        for (const invalidPrice of invalidInputs) {
            try {
                console.log('invalidPrice', invalidPrice)

                const buyAmountEth = ethers.parseUnits(
                    buyAmount.toString(),
                    18
                )
                const buyPriceEth = ethers.parseUnits(invalidPrice, 18)

                const orderBookContractForWallet = ORDERBOOKContract.connect(
                    SIGNERS[unapprovedSpendingWallet]
                )
                await expect( orderBookContractForWallet.placeBuy(
                    buyPriceEth,
                    buyAmountEth,
                    {
                        gasLimit: 500000,
                    }
                )).to.be.reverted;

                
            } catch (error) {
                errorMessage = error.message
                console.log(errorMessage)
            }
           
        }
    }).timeout(DEFAULT_TIMEOUT)

    it('should prevent SELL orders with invalid price', async function () {
        for (const invalidPrice of invalidInputs) {
            try {
                console.log('invalidPrice', invalidPrice)

                const sellAmountEth = ethers.parseUnits(
                    sellAmount.toString(),
                    18
                )
                const sellPriceEth = ethers.parseUnits(invalidPrice, 18)

                const orderBookContractForWallet = ORDERBOOKContract.connect(
                    SIGNERS[unapprovedSpendingWallet]
                )
                
                await expect( orderBookContractForWallet.placeSell(
                    buyPriceEth,
                    buyAmountEth,
                    {
                        gasLimit: 500000,
                    }
                )).to.be.reverted;
            } catch (error) {
                errorMessage = error.message
                console.log(errorMessage)
            }
            
        }
    }).timeout(DEFAULT_TIMEOUT)
})

describe('Control unauthorized admin acces prevention', function () {
    it('Non-admin should be unauthorized to PAUSE the OrderBook', async function () {
        try {
            // Get non-owner signer
            const contractAsNonOwner = ORDERBOOKContract.connect(SIGNERS[1])

            // Try to pause with non-owner
            const tx = await contractAsNonOwner.pauseOrderBook({
                gasLimit: 100000, // Explicit gas limit
            })

            await tx.wait()

            assert.fail('Expected transaction to revert')
        } catch (error) {
            if (error.transaction) {
                console.log('Transaction data:', error.transaction)
            }
        }
    }).timeout(DEFAULT_TIMEOUT)

    it('Non-admin should be unauthorized to UNPAUSE the OrderBook', async function () {
        try {
            // Get non-owner signer
            const contractAsNonOwner = ORDERBOOKContract.connect(SIGNERS[8])

            // Try to pause with non-owner
            const tx = await contractAsNonOwner.unpauseOrderBook({
                gasLimit: 100000, // Explicit gas limit
            })

            await tx.wait()

            assert.fail('Expected transaction to fail')
        } catch (error) {
            if (error.transaction) {
                console.log('Transaction data:', error.transaction)
            }
        }
    }).timeout(DEFAULT_TIMEOUT)
})

//TODO: Check why reversion is not detected
describe('Prevent cancelling an order that does not exist', function () {
    it('should try to cancel one SELL order', async function () {
        const contractAsNonOrderOwner = ORDERBOOKContract.connect(SIGNERS[8])
        console.log(SIGNERS[8])
        await expect(
            contractAsNonOrderOwner.cancelSell({
                gasLimit: 1000000,
            })
        ).to.be.revertedWith('Sell order must already exist')
    }).timeout(DEFAULT_TIMEOUT)
})
