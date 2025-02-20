# STOX Trading Contracts

## Overview
STOX is a decentralized application (dApp) that enables trading of tokenized real-world equities through a Decentralized Limit Order Book system. This repository contains the core smart contracts that power the STOX trading platform.

## Features
* Decentralized Limit Order Book implementation
* Real-world equity tokenization support
* Smart contract-based trading execution
* Secure order matching and settlement

## Prerequisites
Before you begin, ensure you have the following installed:
* [Node.js](https://nodejs.org/) (LTS version recommended)
* [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
* [Hardhat](https://hardhat.org/)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/phil23571113/stox-trading-contracts.git
cd stox-trading-contracts
```

2. Install dependencies:
```bash
pnpm install
```

## Project Structure
```
├── contracts          # Solidity smart contracts
├── deployments        # Deployment scripts and configurations
├── ignition/modules   # Hardhat Ignition deployment modules
├── scripts           # Additional deployment and setup scripts
├── test             # Test scripts for smart contracts
├── hardhat.config.js # Hardhat configuration file
└── README.md        # Project documentation
```

## Development

### Compilation
To compile the smart contracts:
```bash
npx hardhat compile
```

### Testing
To run the test suite:
```bash
npx hardhat test
```

### Deployment
The project uses Hardhat Ignition for streamlined deployments:

1. Start a local Hardhat node:
```bash
npx hardhat node
```

2. In a separate terminal, deploy the contracts:
```bash
npx hardhat ignition deploy ./ignition/modules/Lock.js
```
Note: Replace `Lock.js` with the appropriate module name for your deployment.

## Contract Interaction
You can interact with deployed contracts using the Hardhat console:

1. Launch the console:
```bash
npx hardhat console --network localhost
```

2. Interact with deployed contracts:
```javascript
const Contract = await ethers.getContractFactory("YourContractName");
const contract = await Contract.attach("deployed_contract_address");
// Now you can call functions on 'contract'
```

## Security
- All smart contracts should undergo thorough security audits before mainnet deployment
- Report security vulnerabilities responsibly through appropriate channels
- Follow smart contract best practices and security patterns

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.