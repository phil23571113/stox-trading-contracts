const { ethers } = require('hardhat');

const UNISWAP_V3_FACTORY_ADDRESS = "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24";  
const UNISWAP_V3_FACTORY_ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint24","name":"fee","type":"uint24"},{"indexed":true,"internalType":"int24","name":"tickSpacing","type":"int24"}],"name":"FeeAmountEnabled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnerChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"token0","type":"address"},{"indexed":true,"internalType":"address","name":"token1","type":"address"},{"indexed":true,"internalType":"uint24","name":"fee","type":"uint24"},{"indexed":false,"internalType":"int24","name":"tickSpacing","type":"int24"},{"indexed":false,"internalType":"address","name":"pool","type":"address"}],"name":"PoolCreated","type":"event"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"}],"name":"createPool","outputs":[{"internalType":"address","name":"pool","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickSpacing","type":"int24"}],"name":"enableFeeAmount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint24","name":"","type":"uint24"}],"name":"feeAmountTickSpacing","outputs":[{"internalType":"int24","name":"","type":"int24"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"uint24","name":"","type":"uint24"}],"name":"getPool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"parameters","outputs":[{"internalType":"address","name":"factory","type":"address"},{"internalType":"address","name":"token0","type":"address"},{"internalType":"address","name":"token1","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickSpacing","type":"int24"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"}],"name":"setOwner","outputs":[],"stateMutability":"nonpayable","type":"function"}];  
const token0Address = "0xE5CFC9a03248ec13ae13788b66b7489d5339Bf89";  
const token0Symbol = "MockUSDT";
const token0Decimals = 6;
const token1Address = "0xF27a9024Cf252D31705CeF15a6581F2e0aa7d8F7";
const token1Symbol = "STOX";
const token1Decimals = 18;
FEE = 3000;
const POOL_ABI = [
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    "function liquidity() external view returns (uint128)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)"
];

async function main() {
    const uniswapV3Factory = await ethers.getContractAt(UNISWAP_V3_FACTORY_ABI, UNISWAP_V3_FACTORY_ADDRESS);
    const poolAddress = await uniswapV3Factory.getPool(token0Address, token1Address, FEE); 

    const poolContract = await ethers.getContractAt(POOL_ABI, poolAddress);
    console.log('Pool:', poolContract);


    // Get current liquidity and price
    const liquidity = await poolContract.liquidity();
    console.log("liquidity", liquidity);
    const slot0 = await poolContract.slot0();
    console.log("slot0", slot0);
    const sqrtPriceX96 = slot0[0];
    console.log("sqrtPriceX96", sqrtPriceX96);

    // Calculate reserves using sqrt price and liquidity
    const Q96 = BigInt(2) ** BigInt(96);  // Using BigInt instead of BigNumber

    console.log("Q96", Q96);
    const sqrtPrice = sqrtPriceX96 / Q96;
    
    // Calculate reserves using Uniswap V3 formulas
    // Convert values to BigInt for calculations
    const liquidityBI = BigInt(liquidity.toString());
    const sqrtPriceX96BI = BigInt(sqrtPriceX96.toString());
    
    const token0Reserve = (liquidityBI * Q96) / sqrtPriceX96BI;
    const token1Reserve = (liquidityBI * sqrtPriceX96BI) / Q96;
    
    const output = {
        token0: {
            address: token0Address,
            symbol: token0Symbol,
            reserve: ethers.formatUnits(token0Reserve.toString(), token0Decimals),
        },
        token1: {
            address: token1Address,
            symbol: token1Symbol,
            reserve: ethers.formatUnits(token1Reserve.toString(), token1Decimals),
        },
        poolAddress
    };

    console.log('Pool Reserves:', output);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});