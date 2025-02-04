const { expect } = require('chai')
const { ethers } = require('hardhat');
const { BigNumber } = require("ethers");


let DEFAULT_TIMEOUT = 1000000
let SIGNERS

let PRESALEContract
let PRESALEContractAddress
let STOXContract
let STOXContractAddress
let USDTContract
let USDTContractAddress
let USDCContract
let USDCContractAddress
let MockV3AggregatorContract
let MockV3AggregatorContractAddress

let USDBuyAmount = 100
let USDDistributedAmount = 1000000000

let countInvestingWallets = 5


describe('Retrieve Connected Signers', function () {
    it('retrieve the connected  signers', async function () {
        SIGNERS = await ethers.getSigners()
    }).timeout(DEFAULT_TIMEOUT)
})

describe('Deploy contracts', function () {
    it('should deploy the MockV3Aggregator  contract', async function () {
        this.MockV3AggregatorContractFactory = await ethers.getContractFactory('MockV3Aggregator')
        MockV3AggregatorContract = await this.MockV3AggregatorContractFactory.deploy(
            "271265000000",
        )
        await MockV3AggregatorContract.waitForDeployment()
        MockV3AggregatorContractAddress = await MockV3AggregatorContract.getAddress()
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        await delay(4000);
        console.log('MockV3Aggregator Contract token deployed to:', MockV3AggregatorContractAddress)
    }).timeout(DEFAULT_TIMEOUT)


    it('should deploy the STOX token contract', async function () {
        STOXContract = await ethers.deployContract('Stox')
        STOXContractAddress = await STOXContract.getAddress()
        console.log('STOX Contract token deployed to:', STOXContractAddress)
    }).timeout(DEFAULT_TIMEOUT)

    it('should deploy the USDT token contract', async function () {
        USDTContract = await ethers.deployContract('Usdt')
        USDTContractAddress = await USDTContract.getAddress()
        console.log('USDT Contract token deployed to:', USDTContractAddress)
    }).timeout(DEFAULT_TIMEOUT)

    it('should deploy the USDC token contract', async function () {
        USDCContract = await ethers.deployContract('Usdc')
        USDCContractAddress = await USDCContract.getAddress()
        console.log('USDC Contract token deployed to:', USDCContractAddress)
    }).timeout(DEFAULT_TIMEOUT)

    ////////////////
    //  ///  /// //
    ///         //
    ////  //  ///
    /////   ////
    ///// /////
    ////////// 
    /////////
    ////////
    /// DO NOT USE THESE PARAMS FOR PRODUCTION //

    it('should deploy the PRESALE Contract', async function () {
        this.PresalesContractFactory = await ethers.getContractFactory('UniversePreSale')
        PRESALEContract = await this.PresalesContractFactory.deploy(
            STOXContractAddress,
            USDTContractAddress, // USDT HARDHAT test
            USDCContractAddress, // USDC HARDHAT test
            "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1", // ETH/USD price feed on BASE Testnet
            2,                // Presale rate - corresponds to 0.000002 USD
            "1000000000000000000",                // Min purchase
            "10000000000000000000000",             // Max purchase
            Math.floor(Date.now() / 1000) + 5,    // Presale start time
            Math.floor(Date.now() / 1000) + 60,    // Presale end time
            "500000000000000000000",       // Softcap 20,000 * 1e18
            "500000000000000000000000"    // Hardcap 200,000 * 1e18

        )
        await PRESALEContract.waitForDeployment()
        PRESALEContractAddress = await PRESALEContract.getAddress()
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        await delay(4000);
        console.log('PRESALE Contract token deployed to:', PRESALEContractAddress)
    }).timeout(DEFAULT_TIMEOUT)

    it('should fund the presale contract with STOX tokens', async function () {

        await STOXContract.transfer(
            PRESALEContractAddress,
            ethers.parseUnits('10000000', 18)
        )

    }).timeout(DEFAULT_TIMEOUT)

    it('should confirm the presale contract received the STOX tokens', async function () {
        const balance = await STOXContract.balanceOf(
            PRESALEContractAddress
        )
        console.log(
            `PRESALE Contract STOX balance:`,
            ethers.formatUnits(balance, 18)
        )
        expect(balance.toString()).to.equal('10000000000000000000000000')
    }).timeout(DEFAULT_TIMEOUT)

    it('should check the output of the v3Aggregator call', async function () {

        const pricingData = await MockV3AggregatorContract.latestRoundData()
        console.log('Price:', pricingData.answer.toString())
        expect(pricingData.answer.toString()).to.equal('271265000000')

    }).timeout(DEFAULT_TIMEOUT)
}
)

describe('Distribute tokens', function () {
    it('should send 1000 USDT and 1000 USDC tokens to 4 test wallets', async function () {
        for (let x = 1; x < countInvestingWallets; x++) {
            await USDTContract.transfer(
                SIGNERS[x].address,
                USDDistributedAmount
            )
            await USDCContract.transfer(
                SIGNERS[x].address,
                USDDistributedAmount
            )
        }
    }).timeout(DEFAULT_TIMEOUT)

    it('should confirm the wallets received the USDT tokens', async function () {
        for (let x = 1; x < countInvestingWallets; x++) {
            const balance = await USDTContract.balanceOf(
                SIGNERS[x].address
            )
            console.log(
                `Wallet ${SIGNERS[x].address} USDT balance:`,
                ethers.formatUnits(balance, 6)
            )
            expect(balance.toString()).to.equal(USDDistributedAmount.toString())
        }
    }).timeout(DEFAULT_TIMEOUT)

    it('should confirm the wallets received the USDC tokens', async function () {
        for (let x = 1; x < countInvestingWallets; x++) {
            const balance = await USDCContract.balanceOf(
                SIGNERS[x].address
            )
            console.log(
                `Wallet ${SIGNERS[x].address} USDC balance:`,
                ethers.formatUnits(balance, 6)
            )
            expect(balance.toString()).to.equal(USDDistributedAmount.toString())
        }
    }).timeout(DEFAULT_TIMEOUT)
})

describe('Purchase with USD Stable Coins', function () {

    it('allow USDT spending', async function () {

        const USDTBuyAmountBI = ethers.parseUnits(
            USDBuyAmount.toString(),
            6
        )
        console.log('USDTBuyAmountBI:', USDTBuyAmountBI.toString())
        for (let x = 1; x < countInvestingWallets; x++) {
            const USDTContractForWallet = USDTContract.connect(SIGNERS[x])

            // Approve the ORDERBOOKContract to spend tokens on behalf of this wallet
            await USDTContractForWallet.approve(
                PRESALEContractAddress,
                USDTBuyAmountBI
            )

            // Verify approval 
            const allowance = await USDTContract.allowance(
                SIGNERS[x].address,
                PRESALEContractAddress
            )
            console.log(
                `Wallet ${SIGNERS[x].address
                } approved to spend ${ethers.formatUnits(
                    allowance,
                    6
                )} USDT tokens for PRESALEContractAddress`
            )
            // Add assertions if needed
            expect(allowance.toString()).to.equal(USDTBuyAmountBI.toString())
        }

    }).timeout(DEFAULT_TIMEOUT)

    it('buy tokens with USDT', async function () {
        for (let x = 1; x < countInvestingWallets; x++) {
            const PRESALEContractForWallet = PRESALEContract.connect(SIGNERS[x])
            await PRESALEContractForWallet.buyWithUsdToken(USDTContractAddress, 100_000_000)
        }
    }).timeout(DEFAULT_TIMEOUT)

    it('confirm USDT token purchase', async function () {
        for (let x = 1; x < countInvestingWallets; x++) {
            const PRESALEContractForWallet = PRESALEContract.connect(SIGNERS[x])
            purchaseBalanceDetails = await PRESALEContractForWallet.getPurchaseBalance(SIGNERS[x], USDTContractAddress)
            console.log('purchaseBalanceDetails:', purchaseBalanceDetails)
        }
    }).timeout(DEFAULT_TIMEOUT)

})

describe('Retrieve the presale financials', function () {

    it('get the totalSold, softcap, hardcap presaleStartTime, presaleStopTime, ', async function () {

        const PRESALEContractForWallet = PRESALEContract.connect(SIGNERS[0])
        const totalSold = await PRESALEContractForWallet.totalSold()
        const softcap = await PRESALEContractForWallet.softCap()
        const hardcap = await PRESALEContractForWallet.hardCap()
        const presaleStartTime = await PRESALEContractForWallet.presaleStartTime()
        const presaleEndTime = await PRESALEContractForWallet.presaleEndTime()

        console.log('totalSold:', totalSold.toString())
        console.log('softcap:', softcap.toString())
        console.log('hardcap:', hardcap.toString())
        console.log('presaleStartTime:', presaleStartTime.toString())
        console.log('presaleEndTime:', presaleEndTime.toString())



    }).timeout(DEFAULT_TIMEOUT)
})


describe('Admin Finalization of the presale', function () {

    it('finalize the presale', async function () {
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        await delay(60000);
        const PRESALEContractForWallet = PRESALEContract.connect(SIGNERS[0])
        await PRESALEContractForWallet.finalizePresale()
    }).timeout(DEFAULT_TIMEOUT)

})


describe('POST-PRESALE Withdraw STOX tokens Coins', function () {



    it('should withdraw STOX tokens', async function () {

        for (let x = 1; x < countInvestingWallets; x++) {
            console.log('PRESALE Contract token deployed to:', PRESALEContractAddress)

            const PRESALEContractForWallet = PRESALEContract.connect(SIGNERS[x])
            await PRESALEContractForWallet.withdrawPurchasedUtilityTokens(USDTContractAddress)
        }
    }).timeout(DEFAULT_TIMEOUT)

    it('should  confirm the STOX are on the user account', async function () {
        for (let x = 1; x < countInvestingWallets; x++) {
            const STOXContractForWallet = STOXContract.connect(SIGNERS[x])
            const balance = await STOXContractForWallet.balanceOf(SIGNERS[x].address)
            console.log('STOX balance:', balance.toString())
            expect(balance.toString()).to.equal('200000000000000000000')
        }

    }).timeout(DEFAULT_TIMEOUT)

})


describe('POST-PRESALE ADMIN withdaw USDT Coins', function () {

    it('empty USDT tokens from 0 account (admin)', async function () {
        const balance = await USDTContract.balanceOf(SIGNERS[0].address)
        await USDTContract.transfer(SIGNERS[10].address, balance)
        const newBalance = await USDTContract.balanceOf(SIGNERS[0].address)
        console.log('New USDT balance:', newBalance.toString())
    }).timeout(DEFAULT_TIMEOUT)




    it('should withdraw USDT tokens', async function () {
        console.log('PRESALE Contract token deployed to:', PRESALEContractAddress)
        const PRESALEContractForWallet = PRESALEContract.connect(SIGNERS[0])
        await PRESALEContractForWallet.adminWithdrawRaisedFundsERC20Tokens(USDTContractAddress)

    }).timeout(DEFAULT_TIMEOUT)

    it('should  confirm the USDT are on the user account', async function () {
        const newBalance = await USDTContract.balanceOf(SIGNERS[0].address)
        console.log('New USDT balance:', newBalance.toString())
        expect(newBalance.toString()).to.equal('400000000')
    }).timeout(DEFAULT_TIMEOUT)

})