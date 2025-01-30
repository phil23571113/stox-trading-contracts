const { ethers } = require("hardhat");

async function main() {
    // Sepolia testnet factory address
    const FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
    
    // Your token addresses
    const token0Address = "0x4200000000000000000000000000000000000006";
    const token1Address = "0x8b5cD3355CfBC3864DdDf85d0660E0e53579aA61";
    const fee = 3000; // 0.3% fee tier

    const factory = await ethers.getContractAt(
        ["function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"],
        FACTORY_ADDRESS
    );
    
    const poolAddress = await factory.getPool(token0Address, token1Address, fee);
    console.log('Pool Address:', poolAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });