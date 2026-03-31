# ROSCOMOS â€” Decentralized Rotating Savings on Flow

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

ROSCOMOS is a production-grade backend for managing on-chain ROSCA (Rotating Savings and Credit Association) circles built on the Flow blockchain.

## Tech Stack
- **Runtime**: Node.js + Express
- **Database**: MongoDB + Mongoose (with Redis caching)
- **Blockchain**: Flow FCL + Cadence smart contracts
- **Auth**: JWT (RS256)
- **Real-time**: WebSockets

## Quick Start
```bash
npm install
cp .env.example .env
npm run dev
```

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/circles | Create savings circle |
| GET  | /api/circles | List all circles |
| POST | /api/circles/:id/join | Join a circle |
| POST | /api/circles/:id/contribute | Make contribution |
| POST | /api/circles/:id/payout | Execute payout |
| GET  | /api/admin/stats | Platform statistics |

## Contract
`0xa89655a0f8e3d113` on Flow Testnet
