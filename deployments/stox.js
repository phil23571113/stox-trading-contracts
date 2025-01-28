const { ethers } = require('hardhat');
async function main() {
    console.log('Deploying STOX token...') 
    this.STOXContractFactory = await ethers.getContractFactory('Stox')
    STOXContract = await this.STOXContractFactory.deploy()
    console.log('Waiting for STOX token deployment...')
    await STOXContract.waitForDeployment()
    console.log('STOX token deployed to:', STOXContract.target)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});