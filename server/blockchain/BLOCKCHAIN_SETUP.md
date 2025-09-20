# 🔗 Blockchain Integration Setup Guide

This guide will help you implement secure, encrypted document storage using blockchain technology in your Aegis Digital Identity System.

## 🏗️ Architecture Overview

```
📄 Document Upload
    ↓
🔒 AES-256 Encryption
    ↓
📡 IPFS Storage (Pinata)
    ↓
⛓️ Blockchain Record (Polygon)
    ↓
🗃️ Database Metadata
```

### Key Features:
- **End-to-End Encryption**: Documents are encrypted before leaving your server
- **Decentralized Storage**: Files stored on IPFS for redundancy and availability
- **Immutable Records**: Blockchain provides tamper-proof audit trail
- **Access Control**: Smart contract manages document permissions
- **Integrity Verification**: Hash verification ensures document authenticity

## 📋 Prerequisites

### 1. Install Required Dependencies

```bash
cd server
npm install ethers axios form-data crypto
```

### 2. Get Polygon Mumbai Testnet MATIC

1. Create a new wallet (or use existing one)
2. Visit [Polygon Faucet](https://faucet.polygon.technology/)
3. Get free testnet MATIC tokens

### 3. Setup IPFS Storage (Pinata)

1. Sign up at [Pinata.cloud](https://pinata.cloud/)
2. Generate API keys from dashboard
3. Note down your API Key and Secret

## 🚀 Quick Setup

### Step 1: Environment Configuration

```bash
# Copy the example environment file
cp server/blockchain.env.example server/.env

# Edit the .env file with your values
nano server/.env
```

Required environment variables:
```env
BLOCKCHAIN_RPC_URL=https://rpc-mumbai.maticvigil.com
BLOCKCHAIN_PRIVATE_KEY=your_wallet_private_key_here
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

### Step 2: Deploy Smart Contract

```bash
# Install Hardhat for contract compilation and deployment
npm install --save-dev hardhat @nomiclabs/hardhat-ethers

# Initialize Hardhat
npx hardhat

# Create hardhat.config.js
cat > hardhat.config.js << EOF
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.19",
  networks: {
    mumbai: {
      url: process.env.BLOCKCHAIN_RPC_URL,
      accounts: [process.env.BLOCKCHAIN_PRIVATE_KEY]
    }
  }
};
EOF

# Compile the contract
npx hardhat compile

# Deploy to Mumbai testnet
npx hardhat run server/contracts/deploy.js --network mumbai
```

### Step 3: Update Configuration

After deployment, update your `.env` file:
```env
DOCUMENT_CONTRACT_ADDRESS=0x_your_deployed_contract_address
```

## 🔧 Implementation Details

### Document Storage Flow

1. **File Upload**: User uploads document via dashboard
2. **Encryption**: Document encrypted with AES-256-CBC
3. **IPFS Upload**: Encrypted file uploaded to IPFS
4. **Blockchain Storage**: Document hash and IPFS hash stored on blockchain
5. **Database Record**: Metadata saved to MongoDB

### Document Retrieval Flow

1. **Request**: User requests document download
2. **Blockchain Query**: Fetch document metadata from smart contract
3. **IPFS Download**: Download encrypted file from IPFS
4. **Decryption**: Decrypt file with user's key
5. **Integrity Check**: Verify document hash matches blockchain record
6. **Delivery**: Serve decrypted document to user

## 📊 Smart Contract Functions

### Core Functions

```solidity
// Store a new document
function storeDocument(
    string memory _documentHash,
    string memory _ipfsHash, 
    string memory _encryptionKey,
    address _owner
) returns (uint256 documentId)

// Retrieve document information
function getDocument(uint256 _documentId) 
    returns (string documentHash, string ipfsHash, string encryptionKey, address owner, uint256 timestamp)

// Get user's documents
function getUserDocuments(address _owner) returns (uint256[] memory)

// Grant/revoke document access
function setDocumentPermission(uint256 _documentId, address _user, bool _canAccess)
```

### Security Features

- **Access Control**: Only document owner can grant permissions
- **Integrity Verification**: Document hashes prevent tampering
- **Audit Trail**: All access attempts logged on blockchain
- **Permission Management**: Granular access control per document

## 🔐 Security Considerations

### Encryption

- **Algorithm**: AES-256-CBC
- **Key Generation**: Cryptographically secure random keys
- **User-Specific Keys**: Keys derived from user address
- **No Key Storage**: Encryption keys never stored in plain text

### Access Control

- **Owner-Only Access**: Only document owner can access by default
- **Permission Grants**: Owners can grant access to specific users
- **Smart Contract Enforcement**: Access rules enforced on blockchain
- **Audit Logging**: All access attempts recorded

### Data Privacy

- **Encrypted Storage**: Documents never stored unencrypted
- **Distributed Storage**: No single point of failure
- **Metadata Only**: Only hashes and metadata on blockchain
- **User Control**: Users control their own document access

## 🧪 Testing

### Test Blockchain Integration

```bash
# Test IPFS connection
curl -X POST "https://api.pinata.cloud/data/testAuthentication" \
  -H "pinata_api_key: YOUR_API_KEY" \
  -H "pinata_secret_api_key: YOUR_SECRET_KEY"

# Test contract deployment
node server/contracts/deploy.js

# Test document upload
npm test -- --grep "blockchain"
```

### Frontend Testing

1. Upload a document via dashboard
2. Check for blockchain badges and status
3. Verify transaction hash on [PolygonScan](https://mumbai.polygonscan.com/)
4. Test document download and decryption
5. Verify document integrity

## 📈 Monitoring & Analytics

### Blockchain Events

The smart contract emits events for monitoring:

```solidity
event DocumentStored(uint256 indexed documentId, address indexed owner, string documentHash);
event DocumentAccessed(uint256 indexed documentId, address indexed accessor);
event PermissionGranted(uint256 indexed documentId, address indexed owner, address indexed grantee);
```

### Monitoring Dashboard

Track key metrics:
- Documents stored on blockchain
- IPFS upload success rate
- Transaction costs
- Access patterns
- Error rates

## 🚨 Troubleshooting

### Common Issues

**1. Transaction Failed**
```
Error: insufficient funds for intrinsic transaction cost
```
**Solution**: Add more MATIC to your wallet

**2. IPFS Upload Failed**
```
Error: Failed to upload to IPFS
```
**Solution**: Check Pinata API credentials and network connection

**3. Contract Not Found**
```
Error: Smart contract not initialized
```
**Solution**: Deploy contract and update `DOCUMENT_CONTRACT_ADDRESS`

**4. Decryption Failed**
```
Error: Failed to decrypt document
```
**Solution**: Verify encryption key and user address match

### Debug Mode

Enable detailed logging:
```env
BLOCKCHAIN_LOGGING=true
IPFS_LOGGING=true
NODE_ENV=development
```

## 🔄 Migration from Traditional Storage

### Existing Documents

To migrate existing documents to blockchain:

1. **Backup**: Create backups of all existing documents
2. **Encrypt**: Encrypt documents with new system
3. **Upload**: Upload to IPFS and blockchain
4. **Verify**: Confirm successful migration
5. **Update**: Update database records with blockchain data

### Gradual Migration

- New uploads automatically use blockchain
- Existing documents remain accessible
- Migrate documents on next access
- Dual storage during transition period

## 🌐 Production Deployment

### Mainnet Configuration

```env
# Polygon Mainnet
BLOCKCHAIN_RPC_URL=https://polygon-rpc.com
BLOCKCHAIN_PRIVATE_KEY=your_production_private_key

# Production IPFS settings
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
AUTO_CLEANUP_LOCAL_FILES=true
```

### Security Checklist

- [ ] Private keys stored securely (not in code)
- [ ] API keys rotated regularly
- [ ] Smart contract audited
- [ ] IPFS gateway redundancy configured
- [ ] Monitoring and alerting setup
- [ ] Backup and recovery procedures tested
- [ ] Access logs monitored
- [ ] Gas price optimization implemented

## 📚 Additional Resources

- [Polygon Documentation](https://docs.polygon.technology/)
- [IPFS Documentation](https://docs.ipfs.io/)
- [Ethers.js Documentation](https://docs.ethers.io/)
- [Pinata API Documentation](https://docs.pinata.cloud/)
- [Hardhat Documentation](https://hardhat.org/docs)

## 🆘 Support

For implementation support:

1. Check the troubleshooting section above
2. Review logs for error details
3. Test on Mumbai testnet first
4. Verify all environment variables
5. Check smart contract deployment status

## 📄 License

This blockchain implementation is part of the Aegis Digital Identity System and follows the same licensing terms.
