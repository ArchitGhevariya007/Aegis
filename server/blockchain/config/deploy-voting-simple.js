import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env' });

async function deployVotingContract() {
    try {
        console.log('🗳️  Starting VotingContract deployment...\n');
        
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
        console.log(`   Deployer: ${wallet.address}`);
        
        // Check balance
        const balance = await provider.getBalance(wallet.address);
        console.log(`   Balance: ${ethers.formatEther(balance)} MATIC\n`);
        
        if (balance === 0n) {
            throw new Error('Insufficient balance for deployment. Please fund your wallet.');
        }
        
        // Load compiled contract
        const contractPath = './artifacts/contracts/VotingContract.sol/SecureVotingContract.json';
        if (!fs.existsSync(contractPath)) {
            throw new Error('Contract artifact not found. Run "npx hardhat compile" first.');
        }
        
        const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const abi = contractData.abi;
        const bytecode = contractData.bytecode;
        
        console.log('📦 Deploying SecureVotingContract...');
        const contractFactory = new ethers.ContractFactory(abi, bytecode, wallet);
        
        const contract = await contractFactory.deploy({
            gasLimit: 5000000,
            gasPrice: ethers.parseUnits('30', 'gwei')
        });
        
        console.log(`⏳ Waiting for deployment transaction: ${contract.deploymentTransaction().hash}`);
        await contract.waitForDeployment();
        
        const contractAddress = await contract.getAddress();
        
        console.log('\n✅ Contract deployed successfully!');
        console.log(`   Contract Address: ${contractAddress}`);
        console.log(`   Transaction Hash: ${contract.deploymentTransaction().hash}`);
        console.log(`   Block Explorer: https://amoy.polygonscan.com/address/${contractAddress}`);
        
        // Test the contract
        console.log('\n🧪 Testing contract...');
        const admin = await contract.admin();
        const isActive = await contract.isActive();
        const totalVotes = await contract.totalVotes();
        const partyIds = await contract.getAllPartyIds();
        
        console.log(`   Admin: ${admin}`);
        console.log(`   Voting Active: ${isActive}`);
        console.log(`   Total Votes: ${totalVotes}`);
        console.log(`   Parties Initialized: ${partyIds.length}`);
        
        // Display parties
        console.log('\n🎯 Default Parties:');
        for (let i = 0; i < partyIds.length; i++) {
            const partyId = partyIds[i];
            const party = await contract.getParty(partyId);
            console.log(`   ${i + 1}. ${party.name} ${party.logo} (${party.color}) - Votes: ${party.voteCount}`);
        }
        
        // Save deployment info
        const deploymentInfo = {
            contractAddress,
            transactionHash: contract.deploymentTransaction().hash,
            deployedAt: new Date().toISOString(),
            network: 'amoy',
            deployer: wallet.address,
            blockExplorer: `https://amoy.polygonscan.com/address/${contractAddress}`,
            contractType: 'VotingContract'
        };
        
        fs.writeFileSync(
            './voting-deployment.json',
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log('\n📄 Deployment info saved to voting-deployment.json');
        console.log('\n🔧 Next steps:');
        console.log('   1. Copy this contract address:');
        console.log(`   \x1b[32m   ${contractAddress}\x1b[0m`);
        console.log('   2. Add to your server/.env file:');
        console.log(`   \x1b[36m   VOTING_CONTRACT_ADDRESS=${contractAddress}\x1b[0m`);
        console.log('   3. Restart your server');
        console.log('   4. Test voting functionality!');
        
        return contractAddress;
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw error;
    }
}

// Run deployment
deployVotingContract()
    .then((address) => {
        console.log(`\n🎉 Deployment completed! Contract address: ${address}`);
        process.exit(0);
    })
    .catch((error) => {
        console.error('Deployment failed:', error);
        process.exit(1);
    });

