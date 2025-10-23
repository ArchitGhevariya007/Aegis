# 🚀 Quick Start: Blockchain Voting System

## ⚡ 5-Minute Setup

### 1. Install Hardhat
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### 2. Get Test MATIC
```
https://faucet.polygon.technology
→ Enter your wallet address
→ Request testnet MATIC
```

### 3. Deploy Contract
```bash
npm run deploy-contract
```

### 4. Save Contract Address
```bash
# Copy address from deployment output
# Add to server/.env:
VOTING_CONTRACT_ADDRESS=0xYourContractAddress
```

### 5. Restart Server
```bash
cd server
npm start
```

## ✅ Done!

Your voting system is now:
- 🔐 **Fully Blockchain-Based**
- ⛓️ **Unhackable & Tamper-Proof**
- 🔍 **Transparent & Auditable**
- 🌍 **Decentralized**

---

## 📋 Quick Commands

```bash
# Compile contract
npm run compile-contract

# Deploy contract
npm run deploy-contract

# Verify on PolygonScan
npx hardhat verify --network polygon-amoy CONTRACT_ADDRESS
```

---

## 🧪 Test Voting

1. **Admin:** Start voting (Voting System tab)
2. **User:** Verify face
3. **User:** Select party and vote
4. **Check:** Transaction hash on PolygonScan
5. **Admin:** View results (blockchain-verified)

---

## 🔗 Important Links

- **Faucet:** https://faucet.polygon.technology
- **Explorer:** https://amoy.polygonscan.com
- **Remix IDE:** https://remix.ethereum.org
- **Full Guide:** See `DEPLOY_VOTING_CONTRACT_GUIDE.md`

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| Contract not configured | Add `VOTING_CONTRACT_ADDRESS` to `.env` |
| Insufficient funds | Get MATIC from faucet |
| Already voted | Correct! Can only vote once |
| Voting not active | Admin must start voting first |

---

## 🎯 What's Different Now?

**Before:** Votes in MongoDB (hackable)
**Now:** Votes on blockchain (unhackable)

---

**Ready to deploy? See `DEPLOY_VOTING_CONTRACT_GUIDE.md` for detailed instructions!**

