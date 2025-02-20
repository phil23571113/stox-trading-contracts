const { ethers } = require('hardhat');
const hre = require("hardhat");


let STOXContractAddress
let MOCKUSDTContractAddress
let NVDAcontractAddress
let ORDERBOOKContractAddress

async function STOX_deployment() {
    console.log('Deploying STOX token...')
    let STOXContractFactory = await ethers.getContractFactory('Stox')
    STOXContract = await STOXContractFactory.deploy()
    STOXContract.waitForDeployment()
    STOXContractAddress = await STOXContract.getAddress()
    console.log('STOX token deployed to:', STOXContractAddress)
}

async function MOCK_USDT_deployment() {
    console.log('Deploying MOCK USDT token...')
    let USDTContractFactory = await ethers.getContractFactory('MockUsdt')
    MOCKUSDTContract = await USDTContractFactory.deploy()
    MOCKUSDTContract.waitForDeployment()
    MOCKUSDTContractAddress = await MOCKUSDTContract.getAddress()
    console.log('MOCK USDT token deployed to:', MOCKUSDTContractAddress)
}


async function NVDA_deployment() {
    console.log('Deploying NVDA token...')
    const amount = ethers.parseUnits('1000', 18)
    let NVDAContractFactory = await ethers.getContractFactory('NvidiaSecurity')
    NVDAContract = await NVDAContractFactory.deploy(amount)
    NVDAContract.waitForDeployment()
    NVDAcontractAddress = await NVDAContract.getAddress()
    console.log('NVDA token deployed to:', NVDAcontractAddress)
}

async function ORDERBOOK_deployment() {
    console.log('Deploying Orderbook...')
    let ORDERBOOKContractFactory = await ethers.getContractFactory('Orderbook')
    ORDERBOOKContract = await ORDERBOOKContractFactory.deploy(STOXContractAddress, NVDAcontractAddress)
    ORDERBOOKContract.waitForDeployment()
    ORDERBOOKContractAddress = await ORDERBOOKContract.getAddress()
    console.log('Order Book deployed to:', ORDERBOOKContractAddress)
}



async function PRESALE_deployment() {

    const presale_STOXAmountReserved = 10000000

    const presale_STOXContractAddress = STOXContractAddress
    const presale_USDTContractAddress = MOCKUSDTContractAddress // USDT Mock Token
    const presale_USDCContractAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" // USDC BASE SEPOLIA
    const presale_ETHUSDChainlinkPriceFeedContract = "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1" // ETH/USD BASE SEPOLIA price feed
    const presale_rate = 2 // Presale rate - corresponds to 0.000002 USD
    const presale_minPurchase = "1000000000000000000"
    const presale_maxPurchase = "10000000000000000000000"
    const presale_startTime = Math.floor(Date.now() / 1000) + 10
    const presale_endTime = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 15
    const presale_softcap = "500000000000000000000"
    const presale_hardcap = "500000000000000000000000"
    const presale_lockPeriod = 60 * 60 * 24 * 7 // 60 * 60 * 24 * 30 -> 30 days





    const PresalesContractFactory = await ethers.getContractFactory('UniversePreSale')
    const PRESALEContract = await PresalesContractFactory.deploy(
        presale_STOXContractAddress,
        presale_USDTContractAddress,
        presale_USDCContractAddress,
        presale_ETHUSDChainlinkPriceFeedContract,
        presale_rate,
        presale_minPurchase,
        presale_maxPurchase,
        presale_startTime,
        presale_endTime,
        presale_softcap,
        presale_hardcap,
        presale_lockPeriod,
    )
    PRESALEContract.waitForDeployment()
    const PRESALEContractAddress = await PRESALEContract.getAddress()
    console.log('PRESALE Contract token deployed to:', PRESALEContractAddress)

    await STOXContract.transfer(
        PRESALEContractAddress,
        ethers.parseUnits(presale_STOXAmountReserved.toString(), 18)
    )

    const balance = await STOXContract.balanceOf(
        PRESALEContractAddress
    )
    console.log(
        `PRESALE Contract STOX balance:`,
        ethers.formatUnits(balance, 18)
    )
    console.log('PRESALE Contract parameters:'
        + '\nSTOX Contract Address: ' + presale_STOXContractAddress
        + '\nUSDT Contract Address: ' + presale_USDTContractAddress
        + '\nUSDC Contract Address: ' + presale_USDCContractAddress
        + '\nETH/USD Chainlink Price Feed Contract Address: ' + presale_ETHUSDChainlinkPriceFeedContract
        + '\nRate: ' + presale_rate
        + '\nMin Purchase: ' + presale_minPurchase
        + '\nMax Purchase: ' + presale_maxPurchase
        + '\nStart Time: ' + presale_startTime
        + '\nEnd Time: ' + presale_endTime
        + '\nSoftcap: ' + presale_softcap
        + '\nHardcap: ' + presale_hardcap
        + '\nLock Period: ' + presale_lockPeriod
     )
      console.log('Params ready for contract verification:  '
        + '"' + presale_STOXContractAddress                 
        + '" "' + presale_USDTContractAddress
        + '" "' + presale_USDCContractAddress
        + '" "' + presale_ETHUSDChainlinkPriceFeedContract
        + '" "' + presale_rate
        + '" "' + presale_minPurchase
        + '" "' + presale_maxPurchase
        + '" "' + presale_startTime
        + '" "' + presale_endTime
        + '" "' + presale_softcap
        + '" "' + presale_hardcap
        + '" "' + presale_lockPeriod+'"'
     )
    
   
}

async function main() {
    await STOX_deployment()
    await MOCK_USDT_deployment()
    await NVDA_deployment()
    await ORDERBOOK_deployment()
    await PRESALE_deployment()
}




main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

