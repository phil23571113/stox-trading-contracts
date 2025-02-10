const { ethers } = require('hardhat');

const artifacts = {
    UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
    NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),


  };

const UNISWAP_V3_FACTORY_ADDRESS = "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24";  
const UNISWAP_V3_FACTORY_ABI =  require("./abis/UniswapV3Factory.json");

const POOL_ABI = artifacts.UniswapV3Pool.abi;
const ERC20_ABI = require("./abis/ERC20.json");
const NFP_ABI = require("./abis/NonfungiblePositionManager.json");


const MockUSDT_ADDRESS = "0xE5CFC9a03248ec13ae13788b66b7489d5339Bf89";  
const STOX_ADDRESS = "0xF27a9024Cf252D31705CeF15a6581F2e0aa7d8F7";
FEE = 3000;

async function main() {
    const [deployer] = await ethers.getSigners();

    const uniswapV3Factory = await ethers.getContractAt(UNISWAP_V3_FACTORY_ABI, UNISWAP_V3_FACTORY_ADDRESS);
    const poolAddress = await uniswapV3Factory.getPool(MockUSDT_ADDRESS, STOX_ADDRESS, FEE); 
    console.log('Pool Address:', poolAddress);
    const poolContract = await ethers.getContractAt(POOL_ABI, poolAddress);
    console.log('Pool:', poolContract);

    const nfpmanager= await ethers.getContractAt(NFP_ABI, "0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2");
    const nfpmanagerAddress = await nfpmanager.getAddress();
    console.log("nfpmanagerAddres",nfpmanagerAddress)
    
   

    const usdtContract = await ethers.getContractAt(ERC20_ABI, MockUSDT_ADDRESS);
    const stoxContract = await ethers.getContractAt(ERC20_ABI, STOX_ADDRESS);

    const usdtAmount = ethers.parseUnits("1000000", 6); // Adjust the amount as needed
    const stoxAmount = ethers.parseUnits("1000000", 18); // Adjust the amount as needed

    // Approve the pool contract to spend USDT and STOX
    await usdtContract.approve(nfpmanagerAddress, usdtAmount);
    await stoxContract.approve(nfpmanagerAddress, stoxAmount);

    // Add liquidity to the pool
    const mintParams = {
        token0: MockUSDT_ADDRESS,
        token1: STOX_ADDRESS,
        fee: FEE,
        tickLower: -887220, // Adjust the tick range as needed
        tickUpper: 887220,  // Adjust the tick range as needed
        amount0Desired: usdtAmount,
        amount1Desired: stoxAmount,
        amount0Min: 0,
        amount1Min: 0,
        recipient: deployer.address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10 // 10 minutes from now
    };

    try {
        const tx = await nfpmanager.mint(mintParams);
        await tx.wait();
        console.log('Liquidity added to the pool');
    } catch (error) {
        console.error("Error adding liquidity:", error);
    }

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});


