const { ethers } = require('hardhat');
async function main() {
    this.STOXContractFactory = await ethers.getContractFactory('Stox')
    STOXContract = await this.STOXContractFactory.deploy()
    await STOXContract.waitForDeployment()
    console.log('STOX token deployed to:', STOXContract.target)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});