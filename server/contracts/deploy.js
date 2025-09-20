const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * Deployment script for DocumentManager smart contract
 * Run with: node server/contracts/deploy.js
 */

async function deployContract() {
    try {
        console.log('🚀 Starting DocumentManager contract deployment...\n');
        
        // Initialize provider and wallet
        const provider = new ethers.JsonRpcProvider(
            process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-amoy.polygon.technology'
        );
        
        const wallet = new ethers.Wallet(
            process.env.BLOCKCHAIN_PRIVATE_KEY || (() => {
                throw new Error('BLOCKCHAIN_PRIVATE_KEY not set in environment variables');
            })(),
            provider
        );
        
        console.log('📋 Deployment Configuration:');
        console.log(`   Network: ${provider._network?.name || 'Unknown'}`);
        console.log(`   Deployer: ${wallet.address}`);
        
        // Check balance
        const balance = await provider.getBalance(wallet.address);
        console.log(`   Balance: ${ethers.formatEther(balance)} POL\n`);
        
        if (balance === 0n) {
            throw new Error('Insufficient balance for deployment. Please fund your wallet.');
        }
        
        // Read contract source code
        const contractPath = path.join(__dirname, 'DocumentManager.sol');
        if (!fs.existsSync(contractPath)) {
            throw new Error('DocumentManager.sol not found');
        }
        
        // For this example, we'll use a pre-compiled bytecode
        // In production, you would use Hardhat or Truffle to compile
        console.log('⚠️  Note: Using pre-compiled bytecode. For production, use Hardhat/Truffle.');
        
        // Simplified deployment - you'll need to compile the contract first
        // This is a placeholder showing the deployment process
        const contractFactory = new ethers.ContractFactory(
            getContractABI(),
            getContractBytecode(),
            wallet
        );
        
        console.log('📦 Deploying contract...');
        const contract = await contractFactory.deploy({
            gasLimit: 3000000,
            gasPrice: ethers.parseUnits('30', 'gwei')
        });
        
        console.log(`⏳ Waiting for deployment transaction: ${contract.deploymentTransaction().hash}`);
        await contract.waitForDeployment();
        
        const contractAddress = await contract.getAddress();
        
        console.log('\n✅ Contract deployed successfully!');
        console.log(`   Contract Address: ${contractAddress}`);
        console.log(`   Transaction Hash: ${contract.deploymentTransaction().hash}`);
        console.log(`   Gas Used: ${contract.deploymentTransaction().gasLimit}`);
        
        // Save deployment info
        const deploymentInfo = {
            contractAddress,
            transactionHash: contract.deploymentTransaction().hash,
            deployedAt: new Date().toISOString(),
            network: provider._network?.name || 'Unknown',
            deployer: wallet.address
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'deployment.json'),
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log('\n📄 Deployment info saved to deployment.json');
        console.log('\n🔧 Next steps:');
        console.log('   1. Update your .env file with:');
        console.log(`      DOCUMENT_CONTRACT_ADDRESS=${contractAddress}`);
        console.log('   2. Verify the contract on block explorer');
        console.log('   3. Test the contract functions');
        
        return contractAddress;
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw error;
    }
}

// Contract ABI (same as in blockchainService.js)
function getContractABI() {
    return [
        {
            "inputs": [
                {"internalType": "string", "name": "_documentHash", "type": "string"},
                {"internalType": "string", "name": "_ipfsHash", "type": "string"},
                {"internalType": "string", "name": "_encryptionKey", "type": "string"},
                {"internalType": "address", "name": "_owner", "type": "address"}
            ],
            "name": "storeDocument",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "uint256", "name": "_documentId", "type": "uint256"}],
            "name": "getDocument",
            "outputs": [
                {"internalType": "string", "name": "documentHash", "type": "string"},
                {"internalType": "string", "name": "ipfsHash", "type": "string"},
                {"internalType": "string", "name": "encryptionKey", "type": "string"},
                {"internalType": "address", "name": "owner", "type": "address"},
                {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "address", "name": "_owner", "type": "address"}],
            "name": "getUserDocuments",
            "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "uint256", "name": "_documentId", "type": "uint256"},
                {"internalType": "address", "name": "_user", "type": "address"},
                {"internalType": "bool", "name": "_canAccess", "type": "bool"}
            ],
            "name": "setDocumentPermission",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];
}

// Placeholder bytecode - you need to compile the contract to get actual bytecode
function getContractBytecode() {
    // This is a placeholder. To get actual bytecode:
    // 1. Install Hardhat: npm install --save-dev hardhat
    // 2. Create hardhat.config.js
    // 3. Compile: npx hardhat compile
    // 4. Extract bytecode from artifacts
    
    throw new Error(`
        Contract compilation required!
        
        To deploy this contract:
        1. Install Hardhat: npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
        2. Create hardhat.config.js in your project root
        3. Compile contract: npx hardhat compile
        4. Update this script with actual bytecode
        
        Example hardhat.config.js:
        
        require("@nomiclabs/hardhat-ethers");
        
        module.exports = {
            solidity: "0.8.19",
            networks: {
                mumbai: {
                    url: "https://rpc-mumbai.maticvigil.com",
                    accounts: [process.env.BLOCKCHAIN_PRIVATE_KEY]
                }
            }
        };
    `);
}

// Run deployment if called directly
if (require.main === module) {
    deployContract()
        .then((address) => {
            console.log(`\n🎉 Deployment completed! Contract address: ${address}`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('Deployment failed:', error);
            process.exit(1);
        });
}

module.exports = { deployContract };
