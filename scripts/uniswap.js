const { ethers } = require("hardhat");

// The ABIs we need
const POOL_ABI = [
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    "function liquidity() external view returns (uint128)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)"
];

const ERC20_ABI = [
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)"
];

const FACTORY_ABI = [
    "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"
];

async function getPoolAddress(factoryAddress, token0Address, token1Address, fee) {
    const factory = await ethers.getContractAt(FACTORY_ABI, factoryAddress);
    
    // Sort token addresses
    const [token0, token1] = token0Address.toLowerCase() < token1Address.toLowerCase() 
        ? [token0Address, token1Address] 
        : [token1Address, token0Address];
    
    const poolAddress = await factory.getPool(token0, token1, fee);
    
    if (poolAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error("Pool does not exist");
    }
    
    return poolAddress;
}

async function getPoolReserves(poolAddress) {
    try {
        // Create contract instances
        const poolContract = await ethers.getContractAt(POOL_ABI, poolAddress);
        
        // Get token addresses
        const token0Address = await poolContract.token0();
        const token1Address = await poolContract.token1();
        
        // Get token contracts
        const token0Contract = await ethers.getContractAt(ERC20_ABI, token0Address);
        const token1Contract = await ethers.getContractAt(ERC20_ABI, token1Address);
        
        // Get token info
        const token0Decimals = await token0Contract.decimals();
        console.log("token0Decimals",token0Decimals);
        const token1Decimals = await token1Contract.decimals();
        console.log("token1Decimals",token1Decimals);
        const token0Symbol = await token0Contract.symbol();
        console.log("token0Symbol",token0Symbol);
        const token1Symbol = await token1Contract.symbol();
        console.log("token1Symbol",token1Symbol);
        
        // Get current liquidity and price
        const liquidity = await poolContract.liquidity();
        console.log("liquidity",liquidity);
        const slot0 = await poolContract.slot0();
        console.log("slot0",slot0);
        const sqrtPriceX96 = slot0[0];
        
        // Calculate reserves using sqrt price and liquidity
        const Q96 = ethers.BigNumber.from('2').pow(96);
        const sqrtPrice = sqrtPriceX96.div(Q96);
        
        // Calculate reserves using Uniswap V3 formulas
        const token0Reserve = liquidity.mul(Q96).div(sqrtPriceX96);
        const token1Reserve = liquidity.mul(sqrtPriceX96).div(Q96);
        
        return {
            token0: {
                address: token0Address,
                symbol: token0Symbol,
                reserve: ethers.utils.formatUnits(token0Reserve, token0Decimals),
            },
            token1: {
                address: token1Address,
                symbol: token1Symbol,
                reserve: ethers.utils.formatUnits(token1Reserve, token1Decimals),
            },
            poolAddress
        };
    } catch (error) {
        console.error('Error getting pool reserves:', error);
        throw error;
    }
}

async function main() {
    // Sepolia testnet addresses
    const FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
    
    // Replace these with your token addresses
    const token0Address = "0x4200000000000000000000000000000000000006";
    const token1Address = "0x8b5cD3355CfBC3864DdDf85d0660E0e53579aA61";
    const fee = 3000; // 0.3% fee tier
    
    try {
        // First get the pool address
        const poolAddress = await getPoolAddress(FACTORY_ADDRESS, token0Address, token1Address, fee);
        console.log("Pool Address:", poolAddress);
        
        // Then get the reserves
        const reserves = await getPoolReserves(poolAddress);
        console.log("\nPool Reserves:");
        console.log(`${reserves.token0.symbol}: ${reserves.token0.reserve}`);
        console.log(`${reserves.token1.symbol}: ${reserves.token1.reserve}`);
        
    } catch (error) {
        console.error("Error:", error.message);
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });