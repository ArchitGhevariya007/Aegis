const crypto = require('crypto');
const fs = require('fs');

// Test encryption/decryption to verify our process works
function testEncryptionDecryption() {
    console.log('🧪 Testing encryption/decryption process...\n');
    
    // Test data
    const testData = Buffer.from('This is a test document for debugging encryption', 'utf-8');
    const userAddress = 'archit@gmail.com';
    
    console.log(`📄 Original data: ${testData.length} bytes`);
    console.log(`👤 User address: ${userAddress}`);
    
    // Step 1: Encrypt (simulate current process)
    const encryptionKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    console.log(`\n🔐 Encryption:`);
    console.log(`   Raw key: ${encryptionKey.toString('hex')}`);
    console.log(`   IV: ${iv.toString('hex')}`);
    
    // Create composite key
    const userKey = crypto.createHash('sha256').update(userAddress).digest();
    const compositeKey = crypto.createHash('sha256').update(Buffer.concat([encryptionKey, userKey])).digest('hex');
    
    console.log(`   User key hash: ${userKey.toString('hex')}`);
    console.log(`   Composite key: ${compositeKey}`);
    
    // Encrypt with raw key and IV
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    let encrypted = cipher.update(testData);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    console.log(`   Encrypted: ${encrypted.length} bytes`);
    
    // Step 2: Test decryption methods
    console.log(`\n🔓 Testing decryption methods:`);
    
    // Method 1: Direct composite key
    try {
        console.log(`   Method 1: Direct composite key`);
        const keyBuffer = Buffer.from(compositeKey, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        if (decrypted.toString() === testData.toString()) {
            console.log(`   ✅ Method 1 SUCCESS`);
        } else {
            console.log(`   ❌ Method 1 FAILED - data mismatch`);
        }
    } catch (error) {
        console.log(`   ❌ Method 1 ERROR: ${error.message}`);
    }
    
    // Method 2: Raw key
    try {
        console.log(`   Method 2: Raw encryption key`);
        const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        if (decrypted.toString() === testData.toString()) {
            console.log(`   ✅ Method 2 SUCCESS`);
        } else {
            console.log(`   ❌ Method 2 FAILED - data mismatch`);
        }
    } catch (error) {
        console.log(`   ❌ Method 2 ERROR: ${error.message}`);
    }
    
    // Method 3: Recreate composite
    try {
        console.log(`   Method 3: Recreate composite from stored key`);
        const baseKey = Buffer.from(compositeKey, 'hex'); // This is what we'd have stored
        const userKeyRecreated = crypto.createHash('sha256').update(userAddress).digest();
        const recreatedComposite = crypto.createHash('sha256').update(Buffer.concat([baseKey, userKeyRecreated])).digest();
        
        const decipher = crypto.createDecipheriv('aes-256-cbc', recreatedComposite, iv);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        if (decrypted.toString() === testData.toString()) {
            console.log(`   ✅ Method 3 SUCCESS`);
        } else {
            console.log(`   ❌ Method 3 FAILED - data mismatch`);
        }
    } catch (error) {
        console.log(`   ❌ Method 3 ERROR: ${error.message}`);
    }
    
    return {
        originalKey: encryptionKey.toString('hex'),
        compositeKey: compositeKey,
        iv: iv.toString('hex'),
        encrypted: encrypted,
        testData: testData
    };
}

// Test the actual encryption method from our service
function testServiceEncryption() {
    console.log('\n🔧 Testing service encryption method...\n');
    
    const testData = Buffer.from('Service test document', 'utf-8');
    const userAddress = 'archit@gmail.com';
    
    // Simulate our current encryptDocument method
    const encryptionKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    // Encrypt with raw key
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    let encrypted = cipher.update(testData);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Create composite key (this is what gets stored)
    const userKey = crypto.createHash('sha256').update(userAddress).digest();
    const compositeKey = crypto.createHash('sha256').update(Buffer.concat([encryptionKey, userKey])).digest('hex');
    
    console.log(`Service encryption:`);
    console.log(`   Raw key used for encryption: ${encryptionKey.toString('hex')}`);
    console.log(`   Composite key stored: ${compositeKey}`);
    console.log(`   IV: ${iv.toString('hex')}`);
    console.log(`   Encrypted size: ${encrypted.length} bytes`);
    
    // Now try to decrypt using the stored composite key (this is our problem)
    try {
        console.log(`\nDecrypting with stored composite key:`);
        const storedKey = Buffer.from(compositeKey, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', storedKey, iv);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        console.log(`   ❌ This should fail because we encrypted with raw key but trying to decrypt with composite key`);
    } catch (error) {
        console.log(`   ✅ Expected failure: ${error.message}`);
    }
    
    // Try decrypting with the original raw key
    try {
        console.log(`\nDecrypting with original raw key:`);
        const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        if (decrypted.toString() === testData.toString()) {
            console.log(`   ✅ SUCCESS with raw key - this is the correct method!`);
        }
    } catch (error) {
        console.log(`   ❌ Unexpected failure: ${error.message}`);
    }
}

// Run tests
console.log('🔍 Encryption/Decryption Debug Tool\n');
console.log('=' .repeat(50));

testEncryptionDecryption();
testServiceEncryption();

console.log('\n' + '='.repeat(50));
console.log('🎯 Conclusion: The issue is likely that we\'re encrypting with one key but storing a different key.');
console.log('   We need to either:');
console.log('   1. Store the raw encryption key instead of composite key');
console.log('   2. Encrypt with the composite key from the start');
console.log('   3. Reverse-engineer the raw key from the stored composite key');
