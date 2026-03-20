# CredLedger — Decentralized Freelance Escrow (UPI + Sepolia)

Monorepo:
- `frontend/`: React + Tailwind (Vite)
- `backend/`: Node.js + Express + MongoDB (TypeScript)
- `contracts/`: Hardhat + Solidity (Sepolia)

## Features
- On-chain escrow lifecycle (create, fund, release, dispute) via Sepolia.
- UPI webhook stub for off-chain payment signals.
- Auth with access/refresh JWTs.
- MongoDB-backed jobs, milestones, and transactions.

## Stack
- Frontend: React 19, Vite, Tailwind.
- Backend: Express 5, TypeScript, Mongoose, Zod, JWT, ethers v6.
- Contracts: Hardhat, OpenZeppelin, TypeChain.

## Quickstart
```bash
# from repo root
npm install --workspaces

# backend
cd backend
copy .env.example .env   # fill secrets
npm run dev              # http://localhost:8080/health

# frontend
cd ../frontend
npm run dev              # http://localhost:5173

# contracts
cd ../contracts
copy .env.example .env   # fill RPC + key
npm run build
npm run test
npm run deploy:sepolia   # when ready
```

## Environment
Backend [backend/.env.example](backend/.env.example):
- `PORT=8080`
- `NODE_ENV=development`
- `MONGODB_URI=mongodb://127.0.0.1:27017/freelance_escrow`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `SEPOLIA_RPC_URL`, `OPERATOR_PRIVATE_KEY`, `ESCROW_FACTORY_ADDRESS`
- `UPI_WEBHOOK_SECRET`

Contracts [contracts/.env.example](contracts/.env.example):
- `SEPOLIA_RPC_URL`
- `DEPLOYER_PRIVATE_KEY`

## Useful Scripts
- Root: `npm run install:all`, `npm run dev:backend`, `npm run dev:frontend`, `npm run build:contracts`
- Backend: `npm run dev`, `npm run build`, `npm start`
- Contracts: `npm run build`, `npm run test`, `npm run deploy:sepolia`
- Frontend: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`

## Development Notes
- Health check: `http://localhost:8080/health`
- Update `ESCROW_FACTORY_ADDRESS` after deploying contracts to Sepolia.
- UPI webhook secret is stubbed; replace with your gateway’s signing secret in production.

## Testing
```bash
cd contracts
npm run test
```
(Add backend/frontend tests as they’re implemented.)

