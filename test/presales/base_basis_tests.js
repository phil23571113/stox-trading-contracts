describe('Test Chainlink ETH Price', function () {
    it('should deploy the PRESALE Contract', async function () {
        this.PresalesContractFactory = await ethers.getContractFactory('UniversePreSale')
        PRESALEContract = await this.PresalesContractFactory.deploy(
            STOXContractAddress,
            "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC contract address on BASE Testnet 
            "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC contract address on BASE Testnet
            "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1", // ETH/USD price feed on BASE Testnet
            2000000,                // Presale rate
            1000000,                // Min purchase
            1000000000,             // Max purchase
            1740990146,    // Presale start time
            1743664946,    // Presale end time
            "2000000000000000",       // Softcap
            "1000000000000000000"    // Hardcap

        )
        await PRESALEContract.waitForDeployment()
        console.log('PRESALE Contract token deployed to:', PRESALEContract.address)
    }).timeout(DEFAULT_TIMEOUT)
}
)
