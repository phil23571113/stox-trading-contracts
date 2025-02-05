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
                purchaseBalanceDetails = await PRESALEContractForWallet.getPurchasedBalance(SIGNERS[x], USDTContractAddress)
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
            expect (newBalance.toString()).to.equal('0')
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
})