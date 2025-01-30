const { ethers } = require('hardhat');

/*********************************************************************/
/*** REPLACE THE STOX AND NVDA TOKENDS ADRESS WITH THOSE DEPLOYED ***/
/*********************************************************************/

async function main() {
    this.ORDERBOOKContractFactory = await ethers.getContractFactory('Orderbook')
    ORDERBOOKContract = await this.ORDERBOOKContractFactory.deploy("0x8b5cD3355CfBC3864DdDf85d0660E0e53579aA61", "0xF854f51CA4A488a01b41278a0B3D66Aec2BB94b6")
    await ORDERBOOKContract.waitForDeployment()
    console.log('Order Book deployed to:', await ORDERBOOKContract.target)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
