const crypto = require('crypto');
const blockchainService = require('./services/blockchainService');

// Special recovery function for documents encrypted with old method
function recoverOldDocument(encryptedBuffer, storedCompositeKey, userAddress, iv) {
    console.log('🔧 Attempting to recover old format document...');
    
    // The problem: 
    // - Document was encrypted with: rawKey
    // - We stored: hash(rawKey + userHash) 
    // - We need to find: rawKey
    
    // Since hash functions are one-way, we can't reverse-engineer the raw key
    // However, we can try to brute force or use known patterns
    
    console.log(`   Stored composite: ${storedCompositeKey.substring(0, 16)}...`);
    console.log(`   User: ${userAddress}`);
    console.log(`   IV: ${iv}`);
    
    // Method 1: Check if the stored key might actually be the raw key
    try {
        console.log('   Method 1: Treating stored key as raw encryption key');
        const keyBuffer = Buffer.from(storedCompositeKey, 'hex');
        const ivBuffer = Buffer.from(iv, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
        let decrypted = decipher.update(encryptedBuffer);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        console.log('   ✅ Method 1 SUCCESS - stored key was actually the raw key!');
        return decrypted;
    } catch (error) {
        console.log(`   ❌ Method 1 failed: ${error.message}`);
    }
    
    // Method 2: Try common raw key patterns (this is a long shot)
    const commonPatterns = [
        // Try the composite key as a base for generating a new raw key
        crypto.createHash('sha256').update(storedCompositeKey).digest(),
        crypto.createHash('md5').update(storedCompositeKey).digest(),
        Buffer.from(storedCompositeKey.substring(0, 64), 'hex'), // First 32 bytes
    ];
    
    for (let i = 0; i < commonPatterns.length; i++) {
        try {
            console.log(`   Method ${i + 2}: Pattern-based key derivation`);
            const ivBuffer = Buffer.from(iv, 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', commonPatterns[i], ivBuffer);
            let decrypted = decipher.update(encryptedBuffer);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            console.log(`   ✅ Method ${i + 2} SUCCESS!`);
            return decrypted;
        } catch (error) {
            console.log(`   ❌ Method ${i + 2} failed: ${error.message}`);
        }
    }
    
    throw new Error('Cannot recover document - encryption key mismatch');
}

// Test with a specific document
async function testRecovery() {
    console.log('🔍 Document Recovery Tool\n');
    
    // These would come from your database for the specific document
    const testData = {
        encryptionKey: '9eebde0b6beeaa7f...', // The actual key from your logs
        iv: '01e19167d78c4d0c3f99cbcf6bb09dd5',
        userAddress: 'archit@gmail.com',
        ipfsHash: 'bafkreibqtoxqgbawbzlfykvmp3idjmhsk3omrrqxqul2k2yeom3fq2ymx4'
    };
    
    console.log('Test data:', testData);
    console.log('\nThis tool would help recover your existing documents.');
    console.log('The issue is that we have a hash but need the original key.');
    console.log('\nPossible solutions:');
    console.log('1. Re-upload the documents (they will use the new consistent method)');
    console.log('2. If you have local copies, we can re-encrypt them properly');
    console.log('3. We can try to modify the decryption to handle the legacy format');
}

module.exports = { recoverOldDocument };

if (require.main === module) {
    testRecovery();
}
