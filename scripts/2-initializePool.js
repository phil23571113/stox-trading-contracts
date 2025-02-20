const { ethers } = require('hardhat');


const NFPM_ABI = require("./abis/NonfungiblePositionManager.json");
const MockUSDT_ADDRESS = "0xE5CFC9a03248ec13ae13788b66b7489d5339Bf89";  
const STOX_ADDRESS = "0xF27a9024Cf252D31705CeF15a6581F2e0aa7d8F7";
FEE = 500;

async function main() {
    console.log('Initialize Pool') 
    const nfpmanager= await ethers.getContractAt(NFPM_ABI, "0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2");
    const sqrtPriceX96 = "250541448375047948078879969925660672";
    nfpmanager.createAndInitializePoolIfNecessary(MockUSDT_ADDRESS, STOX_ADDRESS, FEE, sqrtPriceX96);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});