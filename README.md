# Proof-of-Impact Donation Platform 🎯

A blockchain-based transparent donation platform where funds are released to NGOs only after verifiable proof of milestone completion. Built with Scaffold-ETH 2.

**🌐 Live Demo**: [https://poi-9szmmxp16-devanopers-projects.vercel.app/](https://poi-9szmmxp16-devanopers-projects.vercel.app/)

## 🌟 Features

- **Milestone-Based Funding**: Donations are held in escrow and released only when milestones are verified
- **Oracle Verification**: Designated oracles verify proof of work before releasing funds
- **Transparent Tracking**: Real-time campaign progress and fund allocation
- **Proof-of-Impact NFTs**: Donors receive NFTs as proof of their contribution
- **Multi-Campaign Support**: Create and manage multiple NGO campaigns

## 🏗️ Architecture

### Smart Contract (`ProofOfImpact.sol`)

The core smart contract manages:
- Campaign creation with multiple milestones
- Donation collection and escrow
- Proof submission by NGOs
- Oracle verification and fund release
- Impact NFT minting for donors

### Frontend (Next.js + Scaffold-ETH 2)

- **Admin Panel**: Create campaigns and manage oracles
- **Campaign Dashboard**: Browse and donate to active campaigns
- **NGO Dashboard**: Submit proof of milestone completion
- **Oracle Portal**: Verify proofs and release funds

## 🔑 Deployed Contract (Sepolia)

- **ProofOfImpact**: `0x4AD6c8B857840205E09c35a41bBf4AAb1F94d1f3`
- **Chain ID**: 11155111 (Sepolia Testnet)

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v20.18.3)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)
- MetaMask or similar Web3 wallet

## 🚀 Quick Start

### Local Development

1. **Clone and install dependencies**

```bash
git clone https://github.com/VedantUB/hackathon.git
cd hackathon
yarn install
```

2. **Run a local blockchain** (Terminal 1)

```bash
yarn chain
```

3. **Deploy the ProofOfImpact contract** (Terminal 2)

```bash
yarn deploy
```

4. **Start the frontend** (Terminal 3)

```bash
yarn start
```

Visit your app on: `http://localhost:3000`

## 📝 How It Works

1. **Admin creates a campaign** with NGO address, Oracle address, title, and milestones
2. **Donors contribute** ETH to the campaign (held in escrow)
3. **NGO submits proof** of milestone completion (photos, receipts, etc.)
4. **Oracle verifies** the proof and releases funds to NGO
5. **Donors receive** Proof-of-Impact NFTs upon donation
6. **Process repeats** for each milestone until campaign completion

## 🚢 Deploy to Sepolia Testnet

1. **Set up your deployer private key** in `packages/hardhat/.env`

```bash
DEPLOYER_PRIVATE_KEY=your_private_key_here
```

2. **Deploy the contract**

```bash
cd packages/hardhat
yarn deploy --network sepolia
```

3. **Update frontend to use Sepolia** - Edit `packages/nextjs/scaffold.config.ts`:

```typescript
targetNetworks: [chains.sepolia]
```

## 🧪 Testing

Run smart contract tests:

```bash
yarn hardhat:test
```

## 📦 Deploy Frontend to Vercel

```bash
cd packages/nextjs
vercel
```

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity ^0.8.0
- **Development**: Hardhat, TypeScript
- **Frontend**: Next.js 15, React 19
- **Web3**: Wagmi, Viem, RainbowKit
- **UI**: TailwindCSS, DaisyUI

## 📄 License

This project is licensed under the MIT License.

---

**Built with** [Scaffold-ETH 2](https://scaffoldeth.io) 🏗️

- Edit your smart contracts in `packages/hardhat/contracts`
- Edit your frontend homepage at `packages/nextjs/app/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.
- Edit your deployment scripts in `packages/hardhat/deploy`


## Documentation

Visit our [docs](https://docs.scaffoldeth.io) to learn how to start building with Scaffold-ETH 2.

To know more about its features, check out our [website](https://scaffoldeth.io).

## Contributing to Scaffold-ETH 2

We welcome contributions to Scaffold-ETH 2!

Please see [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Scaffold-ETH 2.
