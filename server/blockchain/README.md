# Blockchain Module

This directory contains all blockchain-related functionality for the Aegis application.

## 📁 Structure

```
blockchain/
├── config/                 # Configuration files
│   ├── hardhat.config.js   # Hardhat configuration for smart contract development
│   └── blockchain.env.example # Example environment variables
├── contracts/              # Smart contracts
│   └── DocumentManager.sol # Main document management smart contract
├── scripts/                # Deployment and utility scripts
│   ├── deploy.js           # Contract deployment script
│   └── setup-blockchain.js # Blockchain environment setup checker
├── tests/                  # Blockchain tests
│   └── blockchain.test.js  # Comprehensive blockchain functionality tests
└── README.md               # This file
```

## 🚀 Quick Start

### 1. Environment Setup
Copy the example environment file and configure it:
```bash
cp blockchain/config/blockchain.env.example .env
```

Add your blockchain credentials to `.env`:
```env
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
BLOCKCHAIN_PRIVATE_KEY=your_private_key_here
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

### 2. Check Setup
Verify your blockchain configuration:
```bash
node blockchain/scripts/setup-blockchain.js
```

### 3. Deploy Smart Contract (Optional)
To deploy the document management smart contract:
```bash
cd blockchain/config
npx hardhat compile
npx hardhat run ../scripts/deploy.js --network amoy
```

## 🔧 Features

### Document Encryption & Storage
- **AES-256-CBC Encryption**: Documents are encrypted before uploading to IPFS
- **IPFS Storage**: Encrypted documents are stored on IPFS via Pinata
- **Blockchain Verification**: Document hashes and metadata are recorded on Polygon blockchain

### Security Features
- **User-specific Keys**: Each document uses a unique encryption key combined with user identity
- **Integrity Verification**: Document hashes ensure data integrity
- **Decentralized Storage**: No single point of failure with IPFS
- **Immutable Records**: Blockchain provides tamper-proof audit trail

### Supported Networks
- **Polygon Amoy Testnet** (Development)
- **Polygon Mainnet** (Production - configurable)

## 🛠️ Development

### Running Tests
```bash
npm test blockchain/tests/blockchain.test.js
```

### Compiling Contracts
```bash
cd blockchain/config
npx hardhat compile
```

### Local Development
For local testing without blockchain:
```bash
node blockchain/scripts/setup-blockchain.js
```

## 📖 API Reference

The blockchain functionality is exposed through the `BlockchainService` class in `../services/blockchainService.js`.

### Key Methods
- `encryptDocument(buffer, userAddress)` - Encrypt document with user-specific key
- `uploadToIPFS(encryptedBuffer, fileName)` - Upload to IPFS via Pinata
- `storeDocumentOnBlockchain(hash, ipfsHash, key, userAddress)` - Record on blockchain
- `retrieveDocumentFromIPFS(ipfsHash, key, iv, userAddress)` - Decrypt and retrieve document

## 🔐 Security Considerations

1. **Private Keys**: Never commit private keys to version control
2. **Environment Variables**: Use `.env` files for sensitive configuration
3. **Gas Optimization**: Monitor gas usage for cost efficiency
4. **Key Management**: Implement proper key rotation policies
5. **Access Control**: Validate user permissions before document operations

## 🌍 Networks & Costs

### Polygon Amoy Testnet
- **Currency**: POL (test tokens)
- **Faucet**: https://faucet.polygon.technology/
- **Explorer**: https://amoy.polygonscan.com/
- **Cost**: Free (test network)

### Polygon Mainnet
- **Currency**: POL
- **Cost**: ~$0.01-0.05 per transaction
- **Explorer**: https://polygonscan.com/

## 📚 Additional Resources

- [Polygon Documentation](https://docs.polygon.technology/)
- [IPFS Documentation](https://docs.ipfs.io/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.io/)
