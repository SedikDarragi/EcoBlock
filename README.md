<div align="center">

# 🌿 EcoBlock Network

**A decentralized platform to incentivize, track, and verify sustainable actions through blockchain technology.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-ecoblock--network.netlify.app-00C853?style=for-the-badge&logo=netlify&logoColor=white)](https://ecoblock-network.netlify.app)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](#license)
[![Node](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Ionic](https://img.shields.io/badge/Ionic-8-3880FF?style=for-the-badge&logo=ionic&logoColor=white)](https://ionic.io)
[![Solidity](https://img.shields.io/badge/Solidity-0.8-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org)

<br/>

[**Try the Live Demo →**](https://ecoblock-network.netlify.app)

<br/>

<img src="demo.gif" alt="EcoBlock Network Demo" width="100%" />

</div>

---

## About

EcoBlock Network is a DAO-based platform built to foster a global community committed to reducing environmental impact. Users earn eco-points for sustainable behaviors such as recycling, trading renewable energy, and scanning eco-friendly products — all tracked transparently on-chain.

## Features

| Feature | Description |
|---------|-------------|
| 🔐 **Auth System** | Register, login, and manage your account with JWT-based authentication |
| ⚡ **Energy Trading** | Peer-to-peer marketplace for buying and selling renewable energy |
| ♻️ **Recycle Rewards** | Earn eco-points by logging recycling activities by material type |
| 📦 **Eco Scan** | Scan product barcodes to verify sustainability and earn points |
| 🔗 **Material Trace** | Track material history through the supply chain on-chain |
| 👛 **Wallet Integration** | Connect MetaMask to interact with smart contracts |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Ionic + Angular, TypeScript, Leaflet Maps |
| **Backend** | Node.js, Express, JSON file-based database |
| **Blockchain** | Solidity, Hardhat, ethers.js, Sepolia Testnet |
| **Deployment** | Netlify (client), Render (server) |

## Project Structure

```
EcoBlock/
├── client/              # Ionic/Angular frontend
│   └── src/app/
│       ├── home/            # Dashboard
│       ├── login/           # Login page
│       ├── register/        # Registration page
│       ├── energy-trading/  # Energy marketplace
│       ├── recycle-rewards/ # Recycling tracker
│       ├── eco-scan/        # Barcode scanner
│       ├── material-trace/  # Supply chain traceability
│       ├── profile/         # User profile
│       └── services/        # Auth, blockchain, IPFS services
├── server/              # Express API server
│   ├── controllers/     # Auth logic
│   ├── middleware/       # JWT authentication
│   ├── models/          # Data models
│   └── routes/          # API routes
├── contracts/           # Solidity smart contracts
│   └── contracts/
│       └── EnergyMarket.sol
└── index.js             # Server entry point
```

## Getting Started

### Prerequisites

- **Node.js v20+** — [Download](https://nodejs.org/en/download/)
- **Git** — [Download](https://git-scm.com/downloads)
- **(Optional)** Ionic CLI — `npm install -g @ionic/cli`

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SedikDarragi/EcoBlock.git
   cd EcoBlock
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install --legacy-peer-deps && cd ..
   ```

3. **Set up environment variables**

   Create `contracts/.env`:
   ```
   PRIVATE_KEY=your-metamask-private-key
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
   ```

   Create `server/.env`:
   ```
   JWT_SECRET=your_jwt_secret_here
   PORT=5000
   ```

4. **Start the application**
   ```bash
   npm start
   ```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/register` | Register a new account |
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/auth/user` | Get current user *(auth required)* |
| `POST` | `/api/auth/link-wallet` | Link MetaMask wallet *(auth required)* |
| `GET` | `/api/activity/scan-history` | Get scan history *(auth required)* |
| `POST` | `/api/activity/recycle` | Log recycling activity *(auth required)* |
| `POST` | `/api/products/validate` | Validate a product scan *(auth required)* |

## Disclaimer

This project is developed for **educational and non-commercial purposes only**. It was built during the **IMSET 2025 Hackathon**. It is not intended for commercial use.

For commercial inquiries, contact me on [LinkedIn](https://www.linkedin.com/in/sedik-darragi-73b205352/).

## License

This project is licensed under the [ISC License](LICENSE).
