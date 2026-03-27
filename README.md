# SkillChain — Freelancing Secured by Code

> The decentralized freelance marketplace where smart contracts replace trust issues. 0% fees. Instant payouts. Your reputation, on-chain forever.

A production-grade, blockchain-powered freelance marketplace built on Ethereum Sepolia. Think Upwork/Fiverr, but decentralized — where every payment is escrowed in a smart contract, every milestone is verifiable, and every reputation is immutable.

---

## 🌐 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite + TypeScript + TailwindCSS + Framer Motion |
| **Backend** | Node.js + Express + TypeScript + MongoDB |
| **Blockchain** | Solidity 0.8.24 + Hardhat + Ethers.js v6 (Sepolia Testnet) |
| **Auth** | JWT (Access & Refresh Tokens) |
| **Wallet** | MetaMask / Web3 (BrowserProvider) |
| **Fonts** | Plus Jakarta Sans (Display) + Inter (Body) |

---

## ✨ Core Features

### 🔐 Authentication & Identity
- Email/phone login & registration
- Role-based access control: `CLIENT` and `FREELANCER`
- JWT-secured sessions with localStorage persistence
- MetaMask wallet connection + network detection

### 📋 Job Marketplace
- Clients post jobs with skills, budget, and structured milestones
- Freelancers browse, search, filter, and apply with cover letters + bids
- Status tracking: `OPEN` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED`
- Real-time polling (every 10s)

### 💸 Smart Contract Escrow (On-Chain)
- **EscrowFactory** deploys per-job escrow contracts
- **FreelanceEscrow** manages milestone lifecycle:
  - `depositToMilestone()` — Client funds a milestone
  - `submitWork()` — Freelancer submits deliverables
  - `approve()` — Client approves work
  - `releaseToFreelancer()` — Operator releases funds
  - `openDispute()` — Either party raises a dispute
- **DisputeDAO** handles decentralized arbitration
- Factory Address: [`0xB7C4ef9237693cEA5a89Fe1002606e7608475337`](https://sepolia.etherscan.io/address/0xB7C4ef9237693cEA5a89Fe1002606e7608475337)

### 📊 Dashboard
- Aggregated stats: escrow volume, active jobs, pending milestones, trust score
- Live activity feed
- Quick-post job form with inline milestone builder
- Downloadable JSON reports

### 🛡️ Trust & Risk
- On-chain verification signals
- AI-powered fraud indicators
- KYC integration status
- Risk scoring with rationale

### 🧑 User Profiles
- Wallet connection + address display
- Rating & review history
- Job completion stats
- Risk signal panel

---

## 📁 Project Structure

```
Blockchain/
├── frontend/                         # React + Vite + TailwindCSS
│   └── src/
│       ├── pages/                    # LandingPage, Dashboard, Marketplace, JobDetail, Auth, ...
│       │   └── LandingPage.tsx       # SkillChain high-conversion landing
│       ├── components/
│       │   ├── ui/                   # Button, Card (reusable primitives)
│       │   └── layout/              # Sidebar, Navbar
│       ├── context/                  # AuthContext (JWT), WalletContext (MetaMask)
│       ├── hooks/                    # useContract, usePolling
│       ├── api/                      # Axios client + typed API wrappers
│       ├── abi/                      # Contract ABIs
│       └── utils/                    # formatCurrency, formatDate
│
├── backend/                          # Express + TypeScript + MongoDB
│   └── src/
│       ├── routes/                   # auth, jobs, milestones, escrow, transactions, webhooks
│       ├── models/                   # User, Job, Milestone, Transaction (Mongoose)
│       ├── services/                 # blockchain.service, risk scoring
│       ├── middlewares/              # auth guard, error handler
│       └── config/                   # env, mongo
│
└── contracts/                        # Hardhat + Solidity
    ├── contracts/
    │   ├── FreelanceEscrow.sol       # Core per-job escrow with milestones
    │   ├── EscrowFactory.sol         # Deploys new escrows per job
    │   └── DisputeDAO.sol            # On-chain decentralized arbitration
    ├── scripts/                      # Deployment scripts
    └── test/                         # Contract test suite
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`)
- MetaMask browser extension with Sepolia testnet funds

### 1. Clone & Install

```bash
# Root dependencies
npm install

# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install

# Contracts
cd ../contracts && npm install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
PORT=8080
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/freelance_escrow
JWT_ACCESS_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
SEPOLIA_RPC_URL=https://your-sepolia-rpc-url
OPERATOR_PRIVATE_KEY=your_wallet_private_key
ESCROW_FACTORY_ADDRESS=0xB7C4ef9237693cEA5a89Fe1002606e7608475337
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE=http://localhost:8080/api/v1
VITE_ESCROW_FACTORY_ADDRESS=0x59415f177842d5Dbb702f5fF50C4D7C7858a954A
```

> ⚠️ Never commit `.env` files with real secrets.

### 3. Run

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8080/api/v1 |

---

## 🔗 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register (CLIENT or FREELANCER) |
| `POST` | `/auth/login` | Login + receive JWT |
| `GET` | `/auth/me` | Get current user |
| `GET` | `/jobs` | List all jobs |
| `POST` | `/jobs` | Create job (CLIENT) |
| `GET` | `/jobs/:id` | Job detail + milestones |
| `POST` | `/jobs/:id/apply` | Apply to job (FREELANCER) |
| `POST` | `/jobs/:id/accept` | Accept freelancer (CLIENT) |
| `POST` | `/jobs/:id/escrow` | Register escrow contract |
| `POST` | `/milestones/:id/:action` | Milestone actions (deposit, submit, approve, release, refund, dispute) |
| `GET` | `/escrow/:address` | Get on-chain escrow data |
| `GET` | `/transactions` | List transactions |
| `GET` | `/reports/job/:id` | Download job report |

---

## ⛓️ Blockchain

- **Network:** Ethereum Sepolia Testnet (Chain ID: 11155111)
- **Explorer:** [sepolia.etherscan.io](https://sepolia.etherscan.io)
- **Factory:** [`0xB7C4ef9237693cEA5a89Fe1002606e7608475337`](https://sepolia.etherscan.io/address/0xB7C4ef9237693cEA5a89Fe1002606e7608475337)

### Escrow Lifecycle
```
Client posts job → Freelancer applies → Client accepts
→ Creates Escrow (via Factory) → Client deposits milestone
→ Freelancer submits work → Client approves
→ Operator authorizes release → Funds sent to freelancer
```

### Dispute Flow
```
Either party opens dispute → DisputeDAO resolves
→ Release to freelancer / Refund to client / Split
```

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| Background | `#0F172A` | Main app background |
| Card | `#1E293B` | Card surfaces |
| Primary | `#6366F1` | Buttons, links, focus rings |
| Accent | `#22C55E` | Earnings, success states |
| Secondary | `#06B6D4` | Info highlights |
| Text | `#F1F5F9` | Primary text |
| Muted | `#94A3B8` | Secondary text, labels |
| Display Font | Plus Jakarta Sans | Headings, brand |
| Body Font | Inter | Paragraphs, UI text |

---

## 🧠 Why SkillChain > Upwork/Fiverr

| Feature | Upwork/Fiverr | SkillChain |
|---|---|---|
| Platform Fee | 10-20% | **0%** |
| Payment Hold | 14-day wait | **Instant** (on approval) |
| Reputation | Platform-locked | **On-chain** (portable) |
| Disputes | Manual review | **Smart contract** arbitration |
| Transparency | Opaque | **Fully auditable** on Etherscan |
| Censorship | Platform can ban | **Immutable** contracts |

---

## 📄 License

MIT
