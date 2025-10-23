const { ethers } = require('ethers');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

class BlockchainService {
    constructor() {
        // Initialize with Polygon Amoy testnet (you can switch to mainnet later)
        this.provider = new ethers.JsonRpcProvider(
            process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-amoy.polygon.technology'
        );
        
        // Initialize wallet with private key from environment
        this.wallet = new ethers.Wallet(
            process.env.BLOCKCHAIN_PRIVATE_KEY || this.generateTestWallet(),
            this.provider
        );
        
        // IPFS configuration (using Pinata as IPFS gateway)
        this.ipfsGateway = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
        this.pinataApiKey = process.env.PINATA_API_KEY;
        this.pinataSecretKey = process.env.PINATA_SECRET_KEY;
        
        // Smart contract configuration (optional for now)
        this.contractAddress = process.env.DOCUMENT_CONTRACT_ADDRESS;
        this.contractABI = this.getContractABI();
        
        if (this.contractAddress) {
            try {
                this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.wallet);
            } catch (error) {
                console.warn('⚠️  Smart contract not available, using IPFS-only mode');
                this.contract = null;
            }
        }
        
        console.log('Blockchain service initialized with wallet:', this.wallet.address);
    }
    
    // Generate a test wallet for development (DO NOT use in production)
    generateTestWallet() {
        const wallet = ethers.Wallet.createRandom();
        console.warn('⚠️  Generated test wallet. Set BLOCKCHAIN_PRIVATE_KEY in production!');
        console.log('Test wallet address:', wallet.address);
        console.log('Test wallet private key:', wallet.privateKey);
        return wallet.privateKey;
    }
    
    // Smart contract ABI for document management
    getContractABI() {
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
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "internalType": "uint256", "name": "documentId", "type": "uint256"},
                    {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
                    {"indexed": false, "internalType": "string", "name": "documentHash", "type": "string"}
                ],
                "name": "DocumentStored",
                "type": "event"
            }
        ];
    }
    
    // Encrypt document before storing
    encryptDocument(buffer, userAddress) {
        try {
            // Generate a unique encryption key for this document
            const encryptionKey = crypto.randomBytes(32);
            const iv = crypto.randomBytes(16);
            
            // Create a composite key using user address for additional security
            const userKey = crypto.createHash('sha256').update(userAddress).digest();
            const compositeKey = crypto.createHash('sha256').update(Buffer.concat([encryptionKey, userKey])).digest();
            
            // Encrypt the document using AES-256-CBC with the COMPOSITE key
            const cipher = crypto.createCipheriv('aes-256-cbc', compositeKey, iv);
            let encrypted = cipher.update(buffer);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            
            return {
                encryptedData: encrypted,
                encryptionKey: compositeKey.toString('hex'), // Store the composite key we used for encryption
                rawKey: encryptionKey.toString('hex'), // Keep raw key for debugging
                iv: iv.toString('hex')
            };
        } catch (error) {
            console.error('Document encryption error:', error);
            throw new Error('Failed to encrypt document');
        }
    }
    
    // Decrypt document (now with consistent encryption/decryption)
    decryptDocument(encryptedBuffer, encryptionKey, userAddress, iv) {
        console.log(`🔓 Decrypting document...`);
        console.log(`   Encrypted size: ${encryptedBuffer.length} bytes`);
        console.log(`   Stored key: ${encryptionKey.substring(0, 16)}...`);
        console.log(`   IV: ${iv}`);
        console.log(`   User: ${userAddress}`);
        
        // Method 1: Use stored key directly (new consistent method)
        try {
            console.log(`   🔑 Using stored composite key (new method)`);
            const keyBuffer = Buffer.from(encryptionKey, 'hex');
            const ivBuffer = Buffer.from(iv, 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
            let decrypted = decipher.update(encryptedBuffer);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            console.log(`✅ Decryption successful: ${decrypted.length} bytes`);
            return decrypted;
        } catch (directError) {
            console.log(`   ❌ Direct method failed: ${directError.message}`);
            
            // Method 2: Legacy support - try to reverse-engineer original key
            console.log(`   🔑 Trying legacy key reconstruction...`);
            
            // For old documents, we need to find the raw key that was used for encryption
            // but the composite key was stored. This is tricky without the original raw key.
            // We'll try a few approaches for backwards compatibility.
            
            const legacyMethods = [
                // Method 1: Try stored key as raw encryption key (most likely for old docs)
                () => {
                    console.log(`     Legacy method 1: Stored key as raw encryption key`);
                    const keyBuffer = Buffer.from(encryptionKey, 'hex');
                    const ivBuffer = Buffer.from(iv, 'hex');
                    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
                    let decrypted = decipher.update(encryptedBuffer);
                    return Buffer.concat([decrypted, decipher.final()]);
                },
                
                // Method 2: Try to reconstruct original raw key (reverse hash - impossible but try patterns)
                () => {
                    console.log(`     Legacy method 2: Pattern-based key derivation`);
                    // Try deriving potential raw keys from the composite
                    const potentialKeys = [
                        // Use first 32 bytes of stored key
                        Buffer.from(encryptionKey.substring(0, 64), 'hex'),
                        // Hash the stored key to create a new key
                        crypto.createHash('sha256').update(encryptionKey, 'hex').digest(),
                        // Use stored key with user hash to create new composite
                        (() => {
                            const baseKey = Buffer.from(encryptionKey, 'hex');
                            const userKey = crypto.createHash('sha256').update(userAddress).digest();
                            return crypto.createHash('sha256').update(Buffer.concat([baseKey, userKey])).digest();
                        })()
                    ];
                    
                    for (let key of potentialKeys) {
                        try {
                            const ivBuffer = Buffer.from(iv, 'hex');
                            const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
                            let decrypted = decipher.update(encryptedBuffer);
                            return Buffer.concat([decrypted, decipher.final()]);
                        } catch (e) {
                            // Try next key
                        }
                    }
                    throw new Error('No pattern worked');
                },
                
                // Method 3: Try different user address formats
                () => {
                    console.log(`     Legacy method 3: Alternative user formats`);
                    const userVariants = [
                        userAddress.toLowerCase(),
                        userAddress.toUpperCase(),
                        userAddress.trim(),
                        userAddress.replace(/\s+/g, '')
                    ];
                    
                    for (let variant of userVariants) {
                        try {
                            const baseKey = Buffer.from(encryptionKey, 'hex');
                            const userKey = crypto.createHash('sha256').update(variant).digest();
                            const compositeKey = crypto.createHash('sha256').update(Buffer.concat([baseKey, userKey])).digest();
                            const ivBuffer = Buffer.from(iv, 'hex');
                            const decipher = crypto.createDecipheriv('aes-256-cbc', compositeKey, ivBuffer);
                            let decrypted = decipher.update(encryptedBuffer);
                            return Buffer.concat([decrypted, decipher.final()]);
                        } catch (e) {
                            // Try next variant
                        }
                    }
                    throw new Error('No user variant worked');
                }
            ];
            
            for (let i = 0; i < legacyMethods.length; i++) {
                try {
                    const result = legacyMethods[i]();
                    console.log(`✅ Legacy decryption successful with method ${i + 1}: ${result.length} bytes`);
                    return result;
                } catch (error) {
                    console.log(`     ❌ Legacy method ${i + 1} failed: ${error.message}`);
                }
            }
            
            throw new Error('Failed to decrypt document with any available method');
        }
    }
    
    // Upload encrypted document to IPFS
    async uploadToIPFS(encryptedBuffer, fileName) {
        try {
            if (!this.pinataApiKey || !this.pinataSecretKey) {
                throw new Error('IPFS credentials not configured');
            }
            
            const formData = new FormData();
            formData.append('file', encryptedBuffer, {
                filename: `encrypted_${fileName}`,
                contentType: 'application/octet-stream'
            });
            
            const pinataOptions = JSON.stringify({
                cidVersion: 1,
                customPinPolicy: {
                    regions: [
                        {
                            id: 'FRA1',
                            desiredReplicationCount: 2
                        }
                    ]
                }
            });
            formData.append('pinataOptions', pinataOptions);
            
            const pinataMetadata = JSON.stringify({
                name: `Encrypted Document: ${fileName}`,
                keyvalues: {
                    encrypted: 'true',
                    uploadedAt: new Date().toISOString()
                }
            });
            formData.append('pinataMetadata', pinataMetadata);
            
            const response = await axios.post(
                'https://api.pinata.cloud/pinning/pinFileToIPFS',
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'pinata_api_key': this.pinataApiKey,
                        'pinata_secret_api_key': this.pinataSecretKey
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );
            
            return {
                ipfsHash: response.data.IpfsHash,
                size: response.data.PinSize,
                timestamp: response.data.Timestamp
            };
        } catch (error) {
            console.error('IPFS upload error:', error.response?.data || error.message);
            throw new Error('Failed to upload to IPFS');
        }
    }
    
    // Convert user identifier to blockchain address format
    convertUserToAddress(userIdentifier) {
        // Convert email or user ID to a deterministic address format
        // This creates a pseudo-address from the user identifier for smart contract compatibility
        const hash = crypto.createHash('sha256').update(userIdentifier).digest();
        // Take first 20 bytes and format as Ethereum address
        const addressBytes = hash.slice(0, 20);
        return '0x' + addressBytes.toString('hex');
    }
    
    // Store document on blockchain (with fallback for no contract)
    async storeDocumentOnBlockchain(documentHash, ipfsHash, encryptionKey, userAddress) {
        try {
            if (!this.contract) {
                // Fallback: Create a simple transaction to record the document hash
                console.log('📝 No smart contract - creating simple verification transaction');
                
                const nonce = await this.provider.getTransactionCount(this.wallet.address);
                const transaction = {
                    to: this.wallet.address, // Send to self
                    value: ethers.parseEther('0'), // No value transfer
                    data: ethers.hexlify(ethers.toUtf8Bytes(`DOC:${documentHash.substring(0, 32)}`)), // Document hash in data
                    gasLimit: 25000, // Increased for data
                    gasPrice: ethers.parseUnits('30', 'gwei'),
                    nonce: nonce
                };
                
                const signedTx = await this.wallet.sendTransaction(transaction);
                const receipt = await signedTx.wait();
                
                return {
                    transactionHash: receipt.hash,
                    blockNumber: receipt.blockNumber.toString(),
                    documentId: `simple_${Date.now()}`,
                    gasUsed: receipt.gasUsed.toString(),
                    mode: 'simple_verification'
                };
            }
            
            // Smart contract mode - convert user identifier to address format
            const blockchainAddress = this.convertUserToAddress(userAddress);
            console.log(`📄 Using smart contract for document storage`);
            console.log(`   User: ${userAddress} → Address: ${blockchainAddress}`);
            
            const gasEstimate = await this.contract.storeDocument.estimateGas(
                documentHash,
                ipfsHash,
                encryptionKey,
                blockchainAddress
            );
            
            const transaction = await this.contract.storeDocument(
                documentHash,
                ipfsHash,
                encryptionKey,
                blockchainAddress,
                {
                    gasLimit: gasEstimate * 120n / 100n, // Add 20% buffer
                    gasPrice: ethers.parseUnits('30', 'gwei')
                }
            );
            
            const receipt = await transaction.wait();
            const event = receipt.logs?.find(log => log.fragment?.name === 'DocumentStored');
            const documentId = event?.args?.documentId;
            
            console.log(`✅ Document stored on blockchain via smart contract: ${receipt.hash}`);
            
            return {
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber.toString(),
                documentId: documentId?.toString(),
                gasUsed: receipt.gasUsed.toString(),
                mode: 'smart_contract'
            };
        } catch (error) {
            console.error('Blockchain storage error:', error);
            throw new Error(`Failed to store on blockchain: ${error.message}`);
        }
    }
    
    // Complete document storage process
    async storeDocument(fileBuffer, fileName, userAddress) {
        try {
            console.log(`Starting blockchain storage for: ${fileName}`);
            
            // Step 1: Generate document hash
            const documentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
            
        // Step 2: Encrypt document
        const encryptionResult = this.encryptDocument(fileBuffer, userAddress);
        
        // Step 3: Upload to IPFS
        const ipfsResult = await this.uploadToIPFS(encryptionResult.encryptedData, fileName);
        
        // Step 4: Store on blockchain
        const blockchainResult = await this.storeDocumentOnBlockchain(
            documentHash,
            ipfsResult.ipfsHash,
            encryptionResult.encryptionKey,
            userAddress
        );
        
        return {
            documentHash,
            ipfsHash: ipfsResult.ipfsHash,
            encryptionKey: encryptionResult.encryptionKey,
            encryptionIV: encryptionResult.iv,
            transactionHash: blockchainResult.transactionHash,
            blockNumber: blockchainResult.blockNumber,
            documentId: blockchainResult.documentId,
            timestamp: new Date().toISOString(),
            verified: true
        };
        } catch (error) {
            console.error('Complete document storage error:', error);
            throw error;
        }
    }
    
    // Retrieve and decrypt document from IPFS (simplified version without smart contract)
    async retrieveDocumentFromIPFS(ipfsHash, encryptionKey, encryptionIV, userAddress) {
        try {
            console.log(`📥 Retrieving document from IPFS: ${ipfsHash}`);
            
            // Download from IPFS
            const ipfsUrl = `${this.ipfsGateway}${ipfsHash}`;
            const response = await axios.get(ipfsUrl, { responseType: 'arraybuffer' });
            const encryptedBuffer = Buffer.from(response.data);
            
            console.log(`✅ Downloaded ${encryptedBuffer.length} bytes from IPFS`);
            
            // Decrypt document
            const decryptedBuffer = this.decryptDocument(encryptedBuffer, encryptionKey, userAddress, encryptionIV);
            
            console.log(`🔓 Decrypted to ${decryptedBuffer.length} bytes`);
            
            return {
                documentBuffer: decryptedBuffer,
                verified: true
            };
        } catch (error) {
            console.error('IPFS document retrieval error:', error);
            throw error;
        }
    }
    
    // Get user's documents from blockchain
    async getUserDocuments(userAddress) {
        try {
            if (!this.contract) {
                return [];
            }
            
            const documentIds = await this.contract.getUserDocuments(userAddress);
            const documents = [];
            
            for (const docId of documentIds) {
                try {
                    const [documentHash, ipfsHash, , owner, timestamp] = 
                        await this.contract.getDocument(docId);
                    
                    documents.push({
                        documentId: docId.toString(),
                        documentHash,
                        ipfsHash,
                        owner,
                        timestamp: new Date(timestamp * 1000).toISOString(),
                        blockchainStored: true
                    });
                } catch (error) {
                    console.error(`Error fetching document ${docId}:`, error);
                }
            }
            
            return documents;
        } catch (error) {
            console.error('Error fetching user documents:', error);
            return [];
        }
    }
    
    // Verify document integrity
    async verifyDocument(documentBuffer, documentHash) {
        const computedHash = crypto.createHash('sha256').update(documentBuffer).digest('hex');
        return computedHash === documentHash;
    }
    
    // Get Voting Contract ABI
    getVotingContractABI() {
        return [
            "function castVote(string memory _partyId, bool _faceVerified, bytes32 _userHash) external",
            "function castVoteFor(address _voter, string memory _partyId, bool _faceVerified, bytes32 _userHash) external",
            "function startVoting() external",
            "function stopVoting() external",
            "function resetVoting() external",
            "function getVotingStatus() external view returns (bool _isActive, uint256 _totalVotes, uint256 _startTime, uint256 _endTime, uint256 _partyCount)",
            "function getAllResults() external view returns (string[] memory ids, string[] memory names, string[] memory logos, uint256[] memory voteCounts)",
            "function hasUserVoted(address _voter) external view returns (bool)",
            "function getVote(address _voter) external view returns (string memory partyId, uint256 timestamp, bool faceVerified, bytes32 voteHash)",
            "function getVoterCount() external view returns (uint256)",
            "function admin() external view returns (address)",
            "function isActive() external view returns (bool)",
            "function totalVotes() external view returns (uint256)",
            "event VoteCast(address indexed voter, string partyId, bytes32 voteHash, uint256 timestamp)",
            "event VotingStarted(uint256 timestamp)",
            "event VotingStopped(uint256 timestamp)",
            "event VotingReset(uint256 timestamp)"
        ];
    }

    // Get Voting Contract instance
    getVotingContract() {
        const contractAddress = process.env.VOTING_CONTRACT_ADDRESS;
        if (!contractAddress) {
            throw new Error('VOTING_CONTRACT_ADDRESS not configured in .env');
        }
        
        const abi = this.getVotingContractABI();
        return new ethers.Contract(contractAddress, abi, this.wallet);
    }
    
    // Store vote on blockchain using smart contract
    async storeVoteOnContract(voteData) {
        try {
            const contract = this.getVotingContract();
            const userHash = ethers.id(voteData.userId);
            const voterAddress = this.userToBlockchainAddress(voteData.userId);
            
            // Check if voting is active
            const isActive = await contract.isActive();
            if (!isActive) {
                throw new Error('Voting session is not active on blockchain');
            }
            
            // Encode and send transaction
            const encodedData = contract.interface.encodeFunctionData('castVoteFor', [
                voterAddress,
                voteData.partyId,
                voteData.faceVerified,
                userHash
            ]);
            
            const txRequest = {
                to: await contract.getAddress(),
                data: encodedData,
                gasLimit: 300000,
                gasPrice: ethers.parseUnits('30', 'gwei')
            };
            
            const tx = await this.wallet.sendTransaction(txRequest);
            const receipt = await tx.wait();
            
            // Extract vote hash from event
            let voteHash = null;
            if (receipt.logs && receipt.logs.length > 0) {
                const voteCastEvent = receipt.logs.find(log => {
                    try {
                        const parsed = contract.interface.parseLog(log);
                        return parsed && parsed.name === 'VoteCast';
                    } catch (e) {
                        return false;
                    }
                });
                
                if (voteCastEvent) {
                    const parsed = contract.interface.parseLog(voteCastEvent);
                    voteHash = parsed.args.voteHash;
                }
            }
            
            return {
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber.toString(),
                voteHash: voteHash || userHash,
                timestamp: new Date().toISOString(),
                verified: true,
                contractAddress: await contract.getAddress()
            };
        } catch (error) {
            console.error('Blockchain vote storage error:', error);
            
            // Provide helpful error messages
            if (error.message.includes('Already voted')) {
                throw new Error('User has already voted in this session');
            } else if (error.message.includes('Voting is not active')) {
                throw new Error('Voting session is not active');
            } else if (error.message.includes('Face verification required')) {
                throw new Error('Face verification is required to vote');
            }
            
            throw new Error(`Failed to store vote on blockchain: ${error.message}`);
        }
    }
    
    // Legacy method for backward compatibility (redirects to contract)
    async storeVote(voteData) {
        // Check if voting contract is configured
        if (process.env.VOTING_CONTRACT_ADDRESS) {
            return await this.storeVoteOnContract(voteData);
        }
        
        // Fallback to simple transaction method
        try {
            console.log('🗳️  Storing vote on blockchain (legacy mode)...');
            
            const voteHash = crypto.createHash('sha256')
                .update(JSON.stringify({
                    sessionId: voteData.sessionId,
                    partyId: voteData.partyId,
                    timestamp: voteData.timestamp,
                    faceVerified: voteData.faceVerified
                }))
                .digest('hex');
            
            const nonce = await this.provider.getTransactionCount(this.wallet.address);
            const voteDataHex = ethers.hexlify(
                ethers.toUtf8Bytes(`VOTE:${voteHash.substring(0, 32)}`)
            );
            
            const transaction = {
                to: this.wallet.address,
                value: ethers.parseEther('0'),
                data: voteDataHex,
                gasLimit: 25000,
                gasPrice: ethers.parseUnits('30', 'gwei'),
                nonce: nonce
            };
            
            const signedTx = await this.wallet.sendTransaction(transaction);
            const receipt = await signedTx.wait();
            
            console.log(`✅ Vote stored on blockchain: ${receipt.hash}`);
            
            return {
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber.toString(),
                voteHash,
                timestamp: new Date().toISOString(),
                verified: true
            };
        } catch (error) {
            console.error('Blockchain vote storage error:', error);
            throw new Error(`Failed to store vote on blockchain: ${error.message}`);
        }
    }
    
    // ============== Voting Contract Management ==============
    
    // Start voting session on contract
    async startVotingOnContract() {
        try {
            const contract = this.getVotingContract();
            const wasActive = await contract.isActive();
            
            if (wasActive) {
                return { success: true, message: 'Voting already active' };
            }
            
            const tx = await contract.startVoting({
                gasLimit: 100000,
                gasPrice: ethers.parseUnits('30', 'gwei')
            });
            
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: receipt.hash,
                message: 'Voting session started on blockchain'
            };
        } catch (error) {
            throw new Error(`Failed to start voting: ${error.message}`);
        }
    }
    
    // Stop voting session on contract
    async stopVotingOnContract() {
        try {
            const contract = this.getVotingContract();
            const tx = await contract.stopVoting({
                gasLimit: 100000
            });
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: receipt.hash,
                message: 'Voting session stopped on blockchain'
            };
        } catch (error) {
            throw new Error(`Failed to stop voting: ${error.message}`);
        }
    }
    
    // Reset voting session on contract
    async resetVotingOnContract() {
        try {
            const contract = this.getVotingContract();
            const tx = await contract.resetVoting({
                gasLimit: 500000 // Higher limit for resetting
            });
            const receipt = await tx.wait();
            
            return {
                success: true,
                transactionHash: receipt.hash,
                message: 'Voting session reset on blockchain'
            };
        } catch (error) {
            throw new Error(`Failed to reset voting: ${error.message}`);
        }
    }
    
    // Get voting status from contract
    async getVotingStatusFromContract() {
        try {
            const contract = this.getVotingContract();
            const [isActive, totalVotes, startTime, endTime, partyCount] = await contract.getVotingStatus();
            
            return {
                isActive,
                totalVotes: Number(totalVotes),
                startTime: Number(startTime) * 1000, // Convert to milliseconds
                endTime: Number(endTime) * 1000,
                partyCount: Number(partyCount)
            };
        } catch (error) {
            throw new Error(`Failed to get voting status: ${error.message}`);
        }
    }
    
    // Get all results from contract
    async getResultsFromContract() {
        try {
            const contract = this.getVotingContract();
            const [ids, names, logos, voteCounts] = await contract.getAllResults();
            
            const parties = ids.map((id, index) => ({
                id: id,
                name: names[index],
                logo: logos[index],
                votes: Number(voteCounts[index])
            }));
            
            return parties;
        } catch (error) {
            throw new Error(`Failed to get results: ${error.message}`);
        }
    }
    
    // Check if user has voted on contract
    async hasUserVotedOnContract(userAddress) {
        try {
            const contract = this.getVotingContract();
            const voted = await contract.hasUserVoted(userAddress);
            return voted;
        } catch (error) {
            throw new Error(`Failed to check vote status: ${error.message}`);
        }
    }
    
    // Convert user identifier to blockchain address
    userToBlockchainAddress(userId) {
        // Create deterministic address from user ID
        const hash = crypto.createHash('sha256').update(userId.toString()).digest();
        const addressBytes = hash.slice(0, 20);
        return '0x' + addressBytes.toString('hex');
    }
    
    // Verify vote on blockchain
    async verifyVote(transactionHash) {
        try {
            const transaction = await this.provider.getTransaction(transactionHash);
            if (!transaction) {
                return { verified: false, error: 'Transaction not found' };
            }
            
            const receipt = await this.provider.getTransactionReceipt(transactionHash);
            
            return {
                verified: true,
                blockNumber: receipt.blockNumber.toString(),
                timestamp: new Date().toISOString(),
                confirmations: await transaction.confirmations()
            };
        } catch (error) {
            console.error('Vote verification error:', error);
            return { verified: false, error: error.message };
        }
    }
    
    // Grant document access to another user
    async grantDocumentAccess(documentId, granteeAddress, userAddress) {
        try {
            if (!this.contract) {
                throw new Error('Smart contract not initialized');
            }
            
            const transaction = await this.contract.setDocumentPermission(
                documentId,
                granteeAddress,
                true
            );
            
            const receipt = await transaction.wait();
            
            return {
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
                success: true
            };
        } catch (error) {
            console.error('Grant access error:', error);
            throw error;
        }
    }
}

module.exports = new BlockchainService();
