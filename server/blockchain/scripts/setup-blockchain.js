#!/usr/bin/env node

/**
 * Blockchain Setup Helper Script
 * This script helps beginners set up blockchain integration step by step
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 Aegis Blockchain Setup Helper\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const hasEnvFile = fs.existsSync(envPath);

if (!hasEnvFile) {
    console.log('📄 Creating .env file template...');
    
    const envTemplate = `# ===============================================
# BLOCKCHAIN CONFIGURATION - FILL THESE IN!
# ===============================================

# Step 1: Get this from MetaMask (Account Details > Export Private Key)
BLOCKCHAIN_PRIVATE_KEY=

# Step 2: This is for Amoy testnet (don't change)
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology

# Step 3: Get these from https://app.pinata.cloud/keys
PINATA_API_KEY=
PINATA_SECRET_KEY=

# Step 4: IPFS gateway (don't change)
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Step 5: Contract address (leave empty until deployment)
DOCUMENT_CONTRACT_ADDRESS=

# ===============================================
# OTHER SETTINGS (DON'T CHANGE)
# ===============================================

NODE_ENV=development
BLOCKCHAIN_LOGGING=true
IPFS_LOGGING=true
MAX_BLOCKCHAIN_FILE_SIZE=10485760
IPFS_UPLOAD_TIMEOUT=60000
BLOCKCHAIN_TRANSACTION_TIMEOUT=120000
`;

    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ Created .env file template');
}

// Check current configuration
console.log('🔍 Checking your current setup...\n');

require('dotenv').config();

const checks = [
    {
        name: 'Private Key',
        env: 'BLOCKCHAIN_PRIVATE_KEY',
        check: (val) => val && val.startsWith('0x') && val.length === 66,
        help: 'Get from MetaMask: Account Details > Export Private Key'
    },
    {
        name: 'Pinata API Key',
        env: 'PINATA_API_KEY',
        check: (val) => val && val.length > 10,
        help: 'Sign up at https://app.pinata.cloud/ and create API key'
    },
    {
        name: 'Pinata Secret',
        env: 'PINATA_SECRET_KEY',
        check: (val) => val && val.length > 20,
        help: 'Get from Pinata dashboard when creating API key'
    },
    {
        name: 'Contract Address',
        env: 'DOCUMENT_CONTRACT_ADDRESS',
        check: (val) => val && val.startsWith('0x') && val.length === 42,
        help: 'Deploy contract first: npx hardhat run server/contracts/deploy.js --network amoy',
        optional: true
    }
];

let allGood = true;
let needsContract = false;

checks.forEach(check => {
    const value = process.env[check.env];
    const isValid = check.check(value);
    const status = isValid ? '✅' : (check.optional ? '⚠️ ' : '❌');
    
    console.log(`${status} ${check.name}: ${isValid ? 'Configured' : 'Missing'}`);
    
    if (!isValid && !check.optional) {
        allGood = false;
        console.log(`   💡 ${check.help}\n`);
    } else if (!isValid && check.optional) {
        needsContract = true;
        console.log(`   💡 ${check.help}\n`);
    }
});

// Test wallet connection if private key exists
if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
    try {
        console.log('🔗 Testing blockchain connection...');
        
        const provider = new ethers.JsonRpcProvider(
            process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-amoy.polygon.technology'
        );
        
        const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
        
        console.log(`✅ Wallet connected: ${wallet.address}\n`);
        
        // Check balance
        provider.getBalance(wallet.address).then(balance => {
            const balanceInMatic = ethers.formatEther(balance);
            console.log(`💰 Wallet balance: ${balanceInMatic} MATIC`);
            
            if (parseFloat(balanceInMatic) === 0) {
                console.log('   💡 Get free test MATIC: https://faucet.polygon.technology/');
            }
            console.log('');
            
            showNextSteps();
        }).catch(err => {
            console.log('❌ Could not check balance:', err.message);
            showNextSteps();
        });
        
    } catch (error) {
        console.log('❌ Blockchain connection failed:', error.message);
        showNextSteps();
    }
} else {
    showNextSteps();
}

function showNextSteps() {
    console.log('📋 Next Steps:\n');
    
    if (!allGood) {
        console.log('1. 🔧 Complete the .env file configuration above');
        console.log('2. 📖 Read BLOCKCHAIN_BEGINNER_GUIDE.md for detailed instructions');
        console.log('3. 🔄 Run this script again: node server/setup-blockchain.js\n');
    } else if (needsContract) {
        console.log('1. 📦 Deploy smart contract:');
        console.log('   npm install --save-dev hardhat @nomiclabs/hardhat-ethers');
        console.log('   npx hardhat compile');
        console.log('   npx hardhat run server/contracts/deploy.js --network amoy\n');
        console.log('2. 📝 Add contract address to .env file');
        console.log('3. 🧪 Test: npm test -- --grep "blockchain"\n');
    } else {
        console.log('🎉 Everything looks good! Your blockchain integration is ready!');
        console.log('');
        console.log('🧪 Test your setup:');
        console.log('   npm test -- --grep "blockchain"');
        console.log('');
        console.log('🚀 Start your app and try uploading documents!');
        console.log('   You should see blockchain badges on uploaded documents.');
        console.log('');
    }
    
    console.log('📚 Resources:');
    console.log('   • Beginner Guide: ./BLOCKCHAIN_BEGINNER_GUIDE.md');
    console.log('   • Technical Guide: ./BLOCKCHAIN_SETUP.md');
    console.log('   • Get test POL: https://faucet.polygon.technology/');
        console.log('   • View transactions: https://amoy.polygonscan.com/');
    console.log('');
}

// Check if required packages are installed
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredPackages = ['ethers', 'axios', 'form-data'];
    const missingPackages = requiredPackages.filter(pkg => !deps[pkg]);
    
    if (missingPackages.length > 0) {
        console.log('📦 Missing packages detected. Installing...');
        console.log(`   npm install ${missingPackages.join(' ')}`);
    }
}
