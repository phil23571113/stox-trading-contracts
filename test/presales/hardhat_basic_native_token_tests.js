const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const { expect } = require('chai')
const { ethers } = require('hardhat');
const { BigNumber } = require("ethers");
const { deployPresaleSetupFixture } = require("./hardhat_deployment_fixture");


describe("UniversePreSale USD tests", function () {
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

    console.log('Before')

    before(async function () {
        const fixture = await loadFixture(deployPresaleSetupFixture);
        ({
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
            countInvestingWallets
        } = fixture);
    }
    )


    describe('Test ETH related functions', function () {

        it('should get the latest ETH price', async function () {
            ethPriceInUsd = await PRESALEContract.getLatestETHPrice()
            expect(ethPriceInUsd).to.be.equal( 271265000000)
        }).timeout(DEFAULT_TIMEOUT)

        it('should get the ETH amount against USD', async function () {
            ethAmount = await PRESALEContract.calculateETHAmount(17000000)
            console.log('ethAmount:', ethAmount.toString())
            expect(ethAmount).to.be.equal(6266)
        }).timeout(DEFAULT_TIMEOUT)

    })

    

   
})