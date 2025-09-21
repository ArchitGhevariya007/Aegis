import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("🚀 Starting DocumentManager contract deployment...\n");
    
    // Get the ContractFactory
    const DocumentManager = await ethers.getContractFactory("DocumentManager");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    
    console.log("📋 Deployment Configuration:");
    console.log(`   Deployer: ${deployer.address}`);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`   Balance: ${ethers.formatEther(balance)} POL\n`);
    
    if (balance === 0n) {
        throw new Error("Insufficient balance for deployment. Please fund your wallet.");
    }
    
    // Deploy the contract
    console.log("📦 Deploying contract...");
    const contract = await DocumentManager.deploy({
        gasLimit: 3000000,
        gasPrice: ethers.parseUnits("30", "gwei")
    });
    
    console.log(`⏳ Waiting for deployment transaction: ${contract.deploymentTransaction().hash}`);
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    
    console.log("\n✅ Contract deployed successfully!");
    console.log(`   Contract Address: ${contractAddress}`);
    console.log(`   Transaction Hash: ${contract.deploymentTransaction().hash}`);
    console.log(`   Network: ${contract.runner.provider._network.name}`);
    
    // Verify the contract is working
    console.log("\n🧪 Testing contract...");
    const totalDocs = await contract.getTotalDocuments();
    console.log(`   Total documents: ${totalDocs}`);
    
    console.log("\n🔧 Next steps:");
    console.log("   1. Update your .env file with:");
    console.log(`      DOCUMENT_CONTRACT_ADDRESS=${contractAddress}`);
    console.log("   2. Restart your server");
    console.log("   3. Test document upload");
    
    // Save deployment info
    const fs = await import('fs');
    const deploymentInfo = {
        contractAddress,
        transactionHash: contract.deploymentTransaction().hash,
        deployedAt: new Date().toISOString(),
        network: contract.runner.provider._network.name,
        deployer: deployer.address,
        gasUsed: contract.deploymentTransaction().gasLimit?.toString()
    };
    
    fs.writeFileSync(
        './deployment-info.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n📄 Deployment info saved to deployment-info.json");
    
    return contractAddress;
}

main()
    .then((address) => {
        console.log(`\n🎉 Deployment completed! Contract address: ${address}`);
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
