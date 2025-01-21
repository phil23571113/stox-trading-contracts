const { ethers } = require('hardhat');

/*********************************************************************/
/*** REPLACE THE STOX AND NVDA TOKENDS ADRESS WITH THOSE DEPLOYED ***/
/*********************************************************************/

async function main() {
    this.ORDERBOOKContractFactory = await ethers.getContractFactory('Orderbook')
    ORDERBOOKContract = await this.ORDERBOOKContractFactory.deploy("0xE03Ed0EFa26e418648668735FF3F6C66C923A840", "0x6A8574a2159E3ADa503147F816a917cD235E5c18")
    await ORDERBOOKContract.waitForDeployment()
    console.log('Order Book deployed to:', await ORDERBOOKContract.target)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
