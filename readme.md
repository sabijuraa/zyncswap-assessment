# ZyncSwap — Smart Contract Assessment

Welcome to the ZyncSwap Blockchain Developer Assessment!

ZyncSwap is a decentralised exchange platform built around the **ZYNC** utility token. It includes a Next.js frontend, server-side API routes, a WebSocket market feed, an on-chain ERC-20 token, and an off-chain order matching engine.

Your job is to extend and improve the existing codebase across the full stack — smart contracts, backend API, and frontend UI.

Focus on quality over completeness. Submit what you have when time is up.

---

## Time Consideration

This assessment is scoped for **4–6 hours**. If you hit your limit, submit what you have and use your README to describe what you would finish next.

---

## Getting Started

You need **Node.js 18+** and **npm**.

```bash
# 1. Fork this repo and clone your fork
git clone https://github.com/YOUR_USERNAME/smart-contract-assessment.git
cd smart-contract-assessment
npm install

# 2. Set up environment variables
cp .env.example .env

# 3. Start a local Hardhat blockchain (keep this terminal open)
npm run chain

# 4. Deploy the ZyncToken contract (new terminal)
npm run deploy
# Copy the printed address into .env as ZYNC_TOKEN_ADDRESS

# 5. Start the app
npm run dev
# → http://localhost:3000
```

---

## Project Structure

```
zync-erc20/
├── client/
│   ├── app/                  # Next.js App Router
│   │   ├── (dex)/            # Page routes: /, /swap, /markets, /trade/[id], …
│   │   └── api/              # API routes (no separate Express server)
│   │       ├── v1/config/
│   │       ├── v1/markets/
│   │       ├── v1/orders/
│   │       ├── v1/swap/quote/
│   │       └── v1/wallets/[address]/zync-balance/
│   ├── lib/                  # Server-side engine logic
│   │   ├── marketEngine.js   # Simulated markets + Binance WebSocket feed
│   │   ├── matchingEngine.js # In-memory order book + matching
│   │   ├── swapQuote.js      # Uniswap V2-style swap quote + calldata
│   │   ├── zyncBalance.js    # On-chain ZYNC balance via eth_call
│   │   └── config.js         # Environment variable helpers
│   ├── server.js             # Custom Next.js server (adds /ws/markets WebSocket)
│   └── src/                  # React components, pages, contexts, wallet logic
├── contracts/
│   ├── contracts/
│   │   └── ZyncToken.sol     # ERC-20 ZYNC token
│   ├── scripts/deploy.cjs
│   ├── test/
│   └── hardhat.config.cjs
├── .env.example
└── package.json
```

---

## Tasks

### Task 1 — Bug Fix

Open the app and navigate to `/trade/btc-usdt`. The order book shows simulated data but the **Place Order** button does not submit correctly to `POST /api/v1/orders`.

- Identify why the request fails
- Fix the issue end-to-end (frontend → API route → matching engine)
- The fix should work for both `limit` and `market` order types

---

### Task 2 — New API Endpoint

Add a new endpoint:

```
GET /api/v1/markets/:id/candles?timeframe=5m&limit=100
```

- Return OHLCV candle data for the requested market
- Support `timeframe` values: `1m`, `5m`, `15m`, `1h`
- Support `limit` up to `500`
- Return a `400` with a clear error message for invalid params
- Follow the existing pattern in `client/app/api/v1/markets/`

---

### Task 3 — Frontend Feature

On the `/markets` page, add a **Portfolio** panel that shows:

- A list of the user's open paper-trade positions (already stored in `localStorage` via `PaperTradeContext`)
- For each position: pair, side (long/short), entry price, current mark price, and unrealised PnL
- PnL should update in real time as market prices change via the WebSocket feed
- Use the existing Tailwind styling to match the rest of the UI

---

### Task 4 — Smart Contract Extension

Extend `ZyncToken.sol` or add a new contract:

- Add a `burn(uint256 amount)` function that lets any token holder burn their own tokens
- Add a `burnFrom(address account, uint256 amount)` function using the allowance mechanism
- Emit a `Burned` event with `(address indexed from, uint256 amount)`
- Write tests in `contracts/test/` covering: successful burn, burn exceeding balance, burnFrom with and without allowance

---

## API Reference

All routes are served by the Next.js app at `http://localhost:3000`.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/config` | App and chain config |
| `GET` | `/api/v1/markets` | All markets overview |
| `GET` | `/api/v1/markets/:id` | Market detail — book, trades, candles |
| `WS` | `/ws/markets` | Live market ticks (snapshot + tick) |
| `POST` | `/api/v1/orders` | Place an order |
| `GET` | `/api/v1/orders` | List orders |
| `DELETE` | `/api/v1/orders/:id` | Cancel an order |
| `GET` | `/api/v1/wallets/:address/zync-balance` | ZYNC token balance |
| `GET` | `/api/v1/swap/quote` | Swap quote and calldata |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run chain` | Start local Hardhat node (keep running) |
| `npm run deploy` | Deploy ZyncToken to localhost |
| `npm run compile` | Compile Solidity contracts |
| `npm run test:contracts` | Run contract tests |
| `npm run dev` | Start Next.js dev server on port 3000 |
| `npm run client:build` | Production build |
| `npm run start` | Start production server |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CHAIN_ID` | `31337` | Hardhat local chain ID |
| `RPC_URL` | `http://127.0.0.1:8545` | JSON-RPC endpoint |
| `ZYNC_TOKEN_ADDRESS` | Hardhat default | Deployed token address |
| `PORT` | `3000` | App server port |
| `SWAP_ROUTER_ADDRESS` | — | Uniswap V2 Router address (optional) |
| `WETH_ADDRESS` | — | WETH address for swap routing (optional) |

---

## Evaluation Criteria

| Area | Weight |
|------|--------|
| Task 1 — Bug Fix | 20% |
| Task 2 — API Endpoint | 25% |
| Task 3 — Frontend Feature | 30% |
| Task 4 — Smart Contract | 25% |

You are also evaluated on:

- Code quality and consistency with the existing codebase
- TypeScript / JavaScript correctness
- Error handling and edge cases
- UI polish and accessibility
- Clear commit history and README

---

## Submission

- Do **not** open a PR to this repo — share your **fork URL**
- In your fork, update this `README.md` to explain:
  - How to run your solution
  - What you would improve or finish given more time
  - Any tradeoffs or decisions worth noting
- Make sure `npm install` → `npm run chain` (separate terminal) → `npm run deploy` → `npm run dev` works end-to-end


