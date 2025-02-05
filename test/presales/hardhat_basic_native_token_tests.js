const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const { expect } = require('chai')
const { ethers } = require('hardhat');
const { BigNumber } = require("ethers");
const { deployPresaleSetupFixture } = require("./hardhat_deployment_fixture");


describe("UniversePreSale NATIVE TOKEN tests", function () {
    let DEFAULT_TIMEOUT = 1000000
    let SIGNERS
    let presaleStartTime
    let presaleEndTime
    let STOXAmountInPresale

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

    const contractBalanceABI = [
        "function balanceOf(address owner) view returns (uint256)"
    ];

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
            presaleEndTime,
            STOXAmountInPresale
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

                const raisedEth = await ethers.provider.getBalance(PRESALEContractAddress);
                const USDTContractForWallet = new ethers.Contract(USDTContractAddress, contractBalanceABI, SIGNERS[0]);
                const raisedUsdt = await USDTContractForWallet.balanceOf(PRESALEContractAddress);
                const USDCContractForWallet = new ethers.Contract(USDCContractAddress, contractBalanceABI, SIGNERS[0]);
                const raisedUsdc = await USDCContractForWallet.balanceOf(PRESALEContractAddress);

                console.log('raisedEth:', raisedEth.toString())
                console.log('raisedUsdt:', raisedUsdt.toString())
                console.log('raisedUsdc:', raisedUsdc.toString())
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
                    const PRESALEContractForWallet = PRESALEContract.connect(SIGNERS[x])
                    await PRESALEContractForWallet.withdrawPurchasedUtilityTokens(zeroAddress)
                }
            }).timeout(DEFAULT_TIMEOUT)
            it('should  confirm the STOX are on the user account', async function () {
                for (let x = 1; x < countInvestingWallets; x++) {
                    const STOXContractForWallet = STOXContract.connect(SIGNERS[x])
                    const balance = await STOXContractForWallet.balanceOf(SIGNERS[x].address)
                    console.log('STOX balance:', balance.toString())
                    expect(balance.toString()).to.equal('7372864173409765358596')
                }
            }).timeout(DEFAULT_TIMEOUT)
        })

        describe('POST-PRESALE ADMIN withdaw NATIVE TOKENS', function () {
            it('should withdraw NATIVE TOKENS', async function () {
                const PRESALEContractForWallet = PRESALEContract.connect(SIGNERS[0])
                const raisedEth = await ethers.provider.getBalance(PRESALEContractAddress);
                const oldbalance = await ethers.provider.getBalance(SIGNERS[0].address)
                console.log('NATIVE TOKENS balance BEFORE withdrawal:', oldbalance.toString())
                await PRESALEContractForWallet.adminWithdrawRaisedFundsNativeTokens()
                const newBalance = await ethers.provider.getBalance(SIGNERS[0].address)
                console.log('NATIVE TOKENS balance AFTER withdrawal:', newBalance.toString())
                expect(newBalance - (oldbalance + raisedEth)).to.be.lessThan(40000000000000) // TX FEES 0.00004 ETH

            }).timeout(DEFAULT_TIMEOUT)

        })

        describe('POST-PRESALE ADMIN withdaw remaining UTILITY TOKENS', function () {

            let remainingSTOXTokens

            it('should get remaining UTILITY TOKENS', async function () {
                const PRESALEContractForWallet = PRESALEContract.connect(SIGNERS[0])
                const totalSold = await PRESALEContractForWallet.totalSold()
                const STOXContractForWallet = new ethers.Contract(STOXContractAddress, contractBalanceABI, SIGNERS[0]);
                remainingSTOXTokens = await STOXContractForWallet.balanceOf(PRESALEContractAddress);
                console.log('remainingSTOXTokens:', remainingSTOXTokens.toString())
                //expect(remainingSTOXTokens.toString()).to.equal((STOXAmountInPresale - totalSold).toString()) // TODO: fix expected amt
            }).timeout(DEFAULT_TIMEOUT)

            it('should withdraw remaining UTILITY TOKENS', async function () {

                const STOXContractForWallet = new ethers.Contract(STOXContractAddress, contractBalanceABI, SIGNERS[0]);
                const STOXAmountOnEmitterBeforeWithdraw = await STOXContractForWallet.balanceOf(SIGNERS[0]);

                const PRESALEContractForWallet = PRESALEContract.connect(SIGNERS[0])
                await PRESALEContractForWallet.adminWithdrawRemainingUtilityTokens()
                const STOXAmountOnEmitterAfterWithdraw = await STOXContractForWallet.balanceOf(SIGNERS[0]);

                expect(STOXAmountOnEmitterAfterWithdraw - STOXAmountOnEmitterBeforeWithdraw).to.equal(remainingSTOXTokens)

            }).timeout(DEFAULT_TIMEOUT)



        })

    })




})