const { expect } = require('chai')
const { ethers } = require('hardhat');
const { BigNumber } = require("ethers");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");





async function deployPresaleSetupFixture() {

    const USDDistributedAmount = 1000000000
    const countInvestingWallets = 5

    const SIGNERS = await ethers.getSigners()
    const presaleStartTime = Math.floor(Date.now() / 1000) + 5
    const presaleEndTime = Math.floor(Date.now() / 1000) + 20

    const MockV3AggregatorContractFactory = await ethers.getContractFactory('MockV3Aggregator')
    const MockV3AggregatorContract = await MockV3AggregatorContractFactory.deploy("271265000000",)
    await MockV3AggregatorContract.waitForDeployment()
    const MockV3AggregatorContractAddress = await MockV3AggregatorContract.getAddress()
    console.log('MockV3Aggregator Contract token deployed to:', MockV3AggregatorContractAddress)

    const STOXContract = await ethers.deployContract('Stox')
    const STOXContractAddress = await STOXContract.getAddress()
    console.log('STOX Contract token deployed to:', STOXContractAddress)


    const USDTContract = await ethers.deployContract('Usdt')
    const USDTContractAddress = await USDTContract.getAddress()
    console.log('USDT Contract token deployed to:', USDTContractAddress)


    const USDCContract = await ethers.deployContract('Usdc')
    const USDCContractAddress = await USDCContract.getAddress()
    console.log('USDC Contract token deployed to:', USDCContractAddress)


    const PresalesContractFactory = await ethers.getContractFactory('UniversePreSale')
    const PRESALEContract = await PresalesContractFactory.deploy(
        STOXContractAddress,
        USDTContractAddress, // USDT HARDHAT test
        USDCContractAddress, // USDC HARDHAT test
        MockV3AggregatorContractAddress, // ETH/USD MOCK price feed
        2,                // Presale rate - corresponds to 0.000002 USD
        "1000000000000000000",                // Min purchase
        "10000000000000000000000",             // Max purchase
        presaleStartTime,    // Presale start time
        presaleEndTime,    // Presale end time
        "500000000000000000000",       // Softcap 20,000 * 1e18
        "500000000000000000000000"    // Hardcap 200,000 * 1e18

    )
    PRESALEContract.waitForDeployment()
    const PRESALEContractAddress = await PRESALEContract.getAddress()
    console.log('PRESALE Contract token deployed to:', PRESALEContractAddress)

    await STOXContract.transfer(
        PRESALEContractAddress,
        ethers.parseUnits('10000000', 18)
    )

    const balance = await STOXContract.balanceOf(
        PRESALEContractAddress
    )
    console.log(
        `PRESALE Contract STOX balance:`,
        ethers.formatUnits(balance, 18)
    )

    const pricingData = await MockV3AggregatorContract.latestRoundData()
    console.log('Price:', pricingData.answer.toString())


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


    for (let x = 1; x < countInvestingWallets; x++) {
        const balance = await USDTContract.balanceOf(
            SIGNERS[x].address
        )
        console.log(
            `Wallet ${SIGNERS[x].address} USDT balance:`,
            ethers.formatUnits(balance, 6)
        )
    }



    for (let x = 1; x < countInvestingWallets; x++) {
        const balance = await USDCContract.balanceOf(
            SIGNERS[x].address
        )
        console.log(
            `Wallet ${SIGNERS[x].address} USDC balance:`,
            ethers.formatUnits(balance, 6)
        )
    }

    return {
        SIGNERS,
        PRESALEContract,
        PRESALEContractAddress,
        STOXContract,
        STOXContractAddress,
        USDTContract,
        USDTContractAddress,
        USDCContract,
        USDCContractAddress,
        MockV3AggregatorContract,
        MockV3AggregatorContractAddress,
        USDDistributedAmount,
        countInvestingWallets,
        presaleStartTime,
        presaleEndTime

    }

}

describe("UniversePreSale Deployment Tests", function () {
    let fixture;

    beforeEach(async function () {
        fixture = await loadFixture(deployPresaleSetupFixture);
    });

    describe("Deployment", function () {


        // Add deployment tests here

    });


});

module.exports = {
    deployPresaleSetupFixture
};