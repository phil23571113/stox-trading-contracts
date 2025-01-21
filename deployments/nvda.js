const { ethers } = require('hardhat');
async function main() {
    const amount = ethers.parseUnits('1000', 18)
    this.NVDAContractFactory = await ethers.getContractFactory('NvidiaSecurity')
    NVDAContract = await this.NVDAContractFactory.deploy(amount)
    await NVDAContract.waitForDeployment()
    console.log('NVDA token deployed to:', NVDAContract.target)
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});