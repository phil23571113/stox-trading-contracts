const { ethers } = require('hardhat');

/*********************************************************************/
/*** REPLACE THE STOX AND NVDA TOKENDS ADRESS WITH THOSE DEPLOYED ***/
/*********************************************************************/

async function main() {
    this.ORDERBOOKContractFactory = await ethers.getContractFactory('Orderbook')
    ORDERBOOKContract = await this.ORDERBOOKContractFactory.deploy("0x8b5cD3355CfBC3864DdDf85d0660E0e53579aA61", "0x126c8582d4f460436909A448EdF5201717eE09dC")
    await ORDERBOOKContract.waitForDeployment()
    console.log('Order Book deployed to:', await ORDERBOOKContract.target)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
