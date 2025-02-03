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

let USDBuyAmount = 100


describe('Retrieve Connected Signers', function () {
    it('retrieve the connected  signers', async function () {
        SIGNERS = await ethers.getSigners()
    }).timeout(DEFAULT_TIMEOUT)
})

describe('Deploy contracts', function () {
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


    //
    ////
    ///////
    /////////
    ////////////
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
            1743664946,    // Presale end time
            "20000000000000000000000",       // Softcap 20,000 * 1e18
            "200000000000000000000000"    // Hardcap 200,000 * 1e18

        )
        await PRESALEContract.waitForDeployment()
        PRESALEContractAddress = await PRESALEContract.getAddress()
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        await delay(4000);
        console.log('PRESALE Contract token deployed to:', PRESALEContractAddress)
    }).timeout(DEFAULT_TIMEOUT)
}
)

describe('Purchase with USD Stable Coins', function () {

    it('allow USDT spending', async function () {


        const USDTBuyAmountBI = ethers.parseUnits(
            USDBuyAmount.toString(),
            6
        )
        console.log('USDTBuyAmountBI:', USDTBuyAmountBI.toString())

        const USDTContractForWallet = USDTContract.connect(SIGNERS[0])

        // Approve the ORDERBOOKContract to spend tokens on behalf of this wallet
        await USDTContractForWallet.approve(
            PRESALEContractAddress,
            USDTBuyAmountBI
        )

        // Verify approval 
        const allowance = await USDTContract.allowance(
            SIGNERS[0].address,
            PRESALEContractAddress
        )
        console.log(
            `Wallet ${SIGNERS[0].address
            } approved to spend ${ethers.formatUnits(
                allowance,
                6
            )} USDT tokens for PRESALEContractAddress`
        )

        // Add assertions if needed
        expect(allowance.toString()).to.equal(USDTBuyAmountBI.toString())


    }).timeout(DEFAULT_TIMEOUT)


    it('buy tokens with USDT', async function () {
        const PRESALEContractForWallet = PRESALEContract.connect(SIGNERS[0])
        // Send the buy order on behalf of this wallet
        await PRESALEContractForWallet.buyWithUsdToken(USDTContractAddress, 100_000_000)
    }).timeout(DEFAULT_TIMEOUT)


})