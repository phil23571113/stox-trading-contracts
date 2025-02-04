const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const { expect } = require('chai')
const { ethers } = require('hardhat');
const { BigNumber } = require("ethers");
const { deployPresaleSetupFixture } = require("./hardhat_deployment_fixture");


describe("UniversePreSale USD tests", function () {
    let DEFAULT_TIMEOUT = 1000000
    let SIGNERS
    let presaleStartTime
    let presaleEndTime

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
    let ETHBuyAmount = 0.001
    let USDDistributedAmount = 1000000000
    let zeroAddress = "0x0000000000000000000000000000000000000000"

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
            countInvestingWallets,
            presaleStartTime,
            presaleEndTime
        } = fixture);
    }
    )


    describe('Test ETH related functions', function () {

        it('should get the latest ETH price', async function () {
            ethPriceInUsd = await PRESALEContract.getLatestETHPrice()
            expect(ethPriceInUsd).to.be.equal(271265000000)
        }).timeout(DEFAULT_TIMEOUT)

        it('should get the ETH amount against USD', async function () {
            ethAmount = await PRESALEContract.calculateETHAmount(17000000)
            console.log('ethAmount:', ethAmount.toString())
            expect(ethAmount).to.be.equal(6266)
        }).timeout(DEFAULT_TIMEOUT)

    })



    describe('Purchase with NATIVE tokens', function () {


        it('buy tokens with NATIVE token', async function () {
            const ETHBuyAmountBI = ethers.parseUnits(
                ETHBuyAmount.toString(),
                18
            )

            for (let x = 1; x < countInvestingWallets; x++) {
                const PRESALEContractForWallet = PRESALEContract.connect(SIGNERS[x])
                await PRESALEContractForWallet.buyWithNativeToken(ETHBuyAmountBI, { value: ETHBuyAmountBI })
            }
        }).timeout(DEFAULT_TIMEOUT)

        it('confirm NATIVE token purchase', async function () {

            for (let x = 1; x < countInvestingWallets; x++) {
                const PRESALEContractForWallet = PRESALEContract.connect(SIGNERS[x])
                purchaseBalanceDetails = await PRESALEContractForWallet.getPurchasedBalance(SIGNERS[x], zeroAddress)
                console.log('purchaseBalanceDetails:', purchaseBalanceDetails)
            }
        }).timeout(DEFAULT_TIMEOUT)

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

        describe('Wait until the presal is finished', function () {
            it('should wait until the presale is finished', async function () {
                const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
                const presaleEndTime = await PRESALEContract.presaleEndTime()
                let currentTime = Math.floor(Date.now() / 1000)
                console.log('currentTime:', currentTime.toString())
                console.log('presaleEndTime:', presaleEndTime.toString())
                console.log('Waiting for the presale to finish...')
                while (currentTime < presaleEndTime) {
                    await delay(1000);
                    currentTime = Math.floor(Date.now() / 1000)
                }
            }).timeout(DEFAULT_TIMEOUT)

        })

        describe('Admin Finalization of the presale', function () {
            it('finalize the presale', async function () {
                const PRESALEContractForWallet = PRESALEContract.connect(SIGNERS[0])
                await PRESALEContractForWallet.finalizePresale()
            }).timeout(DEFAULT_TIMEOUT)
        })


        describe('POST-PRESALE Withdraw STOX tokens Coins', function () {
            it('should withdraw STOX tokens', async function () {
                for (let x = 1; x < countInvestingWallets; x++) {
                    console.log('PRESALE Contract token deployed to:', PRESALEContractAddress)

                    const PRESALEContractForWallet = PRESALEContract.connect(SIGNERS[x])
                    await PRESALEContractForWallet.withdrawPurchasedUtilityTokens(zeroAddress)
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

        describe('POST-PRESALE ADMIN withdaw NATIVE TOKENS', function () {
            it('empty NATIVE TOKENS from 0 account (admin)', async function () {
                const balance = await ethers.getBalance(SIGNERS[0].address)
                await ethers.transfer(SIGNERS[10].address, balance)
                const newBalance = await ethers.getBalance(SIGNERS[0].address)
                console.log('New NATIVE TOKENS balance:', newBalance.toString())
                expect(newBalance.toString()).to.equal('0')
            }).timeout(DEFAULT_TIMEOUT)

            it('should withdraw NATIVE TOKENS', async function () {
                const PRESALEContractForWallet = PRESALEContract.connect(SIGNERS[0])
                await PRESALEContractForWallet.adminWithdrawRaisedFundsNativeTokens()

            }).timeout(DEFAULT_TIMEOUT)

            it('should  confirm the NATIVE TOKENS are on the user account', async function () {
                const newBalance = await ethers.getBalance(SIGNERS[0].address)
                console.log('New USDT balance:', newBalance.toString())
                expect(newBalance.toString()).to.equal('400000000')
            }).timeout(DEFAULT_TIMEOUT)

        })

    })




})