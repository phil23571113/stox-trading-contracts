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


  describe('Admin-only functions reversion due to NOT-ADMIN acces', function () {

    it('should only allow admin to finalize the presale', async function () {
      // Attempt to finalize the presale using a non-admin account.
      const nonAdmin = SIGNERS[1];
      const PRESALEContractForNonAdmin = PRESALEContract.connect(nonAdmin);
      await expect(
        PRESALEContractForNonAdmin.finalizePresale()
      ).to.be.revertedWithCustomError(
        PRESALEContractForNonAdmin,
        "OwnableUnauthorizedAccount"
      ); // Adjust per your contract's error message.
    }).timeout(DEFAULT_TIMEOUT);

   

  });

  describe('Admin-only functions ADMIN access tests', function () {



    it('should prevent admin to finalize the presale bedore end', async function () {
      // Attempt to finalize the presale using a non-admin account.
      const nonAdmin = SIGNERS[0];
      const PRESALEContractForAdmin = PRESALEContract.connect(nonAdmin);
      await expect(
        PRESALEContractForAdmin.finalizePresale()
      ).to.be.reverted;
    }).timeout(DEFAULT_TIMEOUT);


  });

})