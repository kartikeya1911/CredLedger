# Decentralized Freelance Escrow (UPI + Sepolia)

Monorepo:
- `frontend/`: React + Tailwind (Vite)
- `backend/`: Node.js + Express + MongoDB (TypeScript)
- `contracts/`: Hardhat + Solidity (Sepolia)

## Prereqs
- Node.js 18+ (recommended 20+)
- MongoDB running locally (or Atlas connection string)

## Run Frontend
```bash
cd frontend
npm install
npm run dev
```

## Run Backend
```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Backend health: `http://localhost:8080/health`

## Compile / Deploy Contracts
```bash
cd contracts
copy .env.example .env
npm install
npm run build
npm run deploy:sepolia
```

