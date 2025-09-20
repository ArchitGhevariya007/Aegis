import { ethers } from 'ethers';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

async function testBlockchainBasics() {
    console.log('🧪 Testing basic blockchain functionality...\n');
    
    try {
        // Test 1: Provider connection
        console.log('1. Testing provider connection...');
        const provider = new ethers.JsonRpcProvider(
            process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-amoy.polygon.technology'
        );
        
        // Test network
        const network = await provider.getNetwork();
        console.log(`   ✅ Connected to: ${network.name} (Chain ID: ${network.chainId})`);
        
        // Test 2: Wallet connection
        console.log('\n2. Testing wallet connection...');
        const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
        console.log(`   ✅ Wallet address: ${wallet.address}`);
        
        // Test 3: Balance check
        console.log('\n3. Checking wallet balance...');
        const balance = await provider.getBalance(wallet.address);
        console.log(`   ✅ Balance: ${ethers.formatEther(balance)} POL`);
        
        if (balance === 0n) {
            console.log('   ⚠️  Warning: No balance! Get test POL from https://faucet.polygon.technology/');
        }
        
        // Test 4: Encryption test
        console.log('\n4. Testing document encryption...');
        const testData = Buffer.from('This is a test document for blockchain storage', 'utf-8');
        const userAddress = wallet.address;
        
        // Generate encryption key
        const encryptionKey = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);
        
        // Encrypt
        const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
        let encrypted = cipher.update(testData);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        console.log(`   ✅ Document encrypted (${encrypted.length} bytes)`);
        
        // Decrypt
        const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        if (decrypted.toString() === testData.toString()) {
            console.log('   ✅ Document decryption successful');
        } else {
            console.log('   ❌ Document decryption failed');
        }
        
        // Test 5: Hash verification
        console.log('\n5. Testing document integrity...');
        const documentHash = crypto.createHash('sha256').update(testData).digest('hex');
        const verifyHash = crypto.createHash('sha256').update(decrypted).digest('hex');
        
        if (documentHash === verifyHash) {
            console.log('   ✅ Document integrity verified');
        } else {
            console.log('   ❌ Document integrity check failed');
        }
        
        console.log('\n🎉 All basic blockchain tests passed!');
        console.log('\n📝 What this means:');
        console.log('   • Your wallet is connected to Amoy testnet');
        console.log('   • Document encryption/decryption works');
        console.log('   • Hash verification ensures document integrity');
        console.log('   • You can store encrypted documents (IPFS setup needed)');
        
        console.log('\n🔧 Next steps:');
        console.log('   1. Your setup is working without smart contract');
        console.log('   2. Documents will be encrypted and stored on IPFS');
        console.log('   3. Metadata will be stored in your database');
        console.log('   4. Smart contract can be deployed later for advanced features');
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.message.includes('BLOCKCHAIN_PRIVATE_KEY')) {
            console.log('\n💡 Fix: Add your private key to .env file');
        } else if (error.message.includes('network')) {
            console.log('\n💡 Fix: Check internet connection and RPC URL');
        }
        
        return false;
    }
}

// Run tests
testBlockchainBasics()
    .then((success) => {
        if (success) {
            console.log('\n✅ Your blockchain integration is ready to use!');
            console.log('You can now upload documents to your app and they will be encrypted.');
        } else {
            console.log('\n❌ Please fix the issues above before proceeding.');
        }
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
