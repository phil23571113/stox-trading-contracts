const { expect } = require('chai')
const { ethers } = require('hardhat');
const { BigNumber } = require("ethers");


let DEFAULT_TIMEOUT = 1000000
let SIGNERS

let PRESALEContract


describe('Retrieve Connected Signers', function () {
    it('retrieve the connected  signers', async function () {
        SIGNERS = await ethers.getSigners()
    }).timeout(DEFAULT_TIMEOUT)
})

describe('Deploy contracts', function () {
    it('should deploy the PRESALE Contract', async function () {
        this.PresalesContractFactory = await ethers.getContractFactory('PreSale')
        PRESALEContract = await this.PresalesContractFactory.deploy(
            
        )
        await PRESALEContract.waitForDeployment()
        console.log('PRESALE Contract token deployed to:', PRESALEContract.address)
    }).timeout(DEFAULT_TIMEOUT) }
)
