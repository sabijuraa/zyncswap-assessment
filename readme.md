# ZyncSwap — Smart Contract Developer Assessment

Welcome to the ZyncSwap **Smart Contract Developer** assessment.

ZyncSwap is a decentralised exchange platform built around the **ZYNC** utility token. This repository includes a reference Next.js frontend and API for context, but **your assessment is limited to the `contracts/` workspace** — Solidity, Hardhat tests, and deployment scripts.

You are **not** expected to modify frontend or backend code.

Focus on correctness, security, and test coverage. Submit what you have when time is up.

---

## Time Consideration

This assessment is scoped for **4–6 hours**. If you hit your limit, submit what you have and use your README to describe what you would finish next.

---

## Getting Started

You need **Node.js 18+** and **npm**.

### Contract work (required for the assessment)

```bash
# 1. Fork this repo and clone your fork
git clone https://github.com/YOUR_USERNAME/smart-contract-assessment.git
cd smart-contract-assessment
npm install

# 2. Compile contracts
npm run compile

# 3. Run existing tests
npm run test:contracts
```

### Running the full project (optional)

The DEX frontend and API are included so you can explore the product and verify your deployed contract on a local chain. **You do not need to change any frontend or backend code** to complete the assessment.

```bash
# 1. Set up environment variables
cp .env.example .env

# 2. Start a local Hardhat blockchain (keep this terminal open)
npm run chain

# 3. Deploy the ZyncToken contract (new terminal)
npm run deploy
# Copy the printed address into .env as ZYNC_TOKEN_ADDRESS

# 4. Start the app
npm run dev
# → http://localhost:3000
```

---

## Project Structure

Your work lives under `contracts/`:

```
contracts/
├── contracts/
│   └── ZyncToken.sol     # ERC-20 ZYNC token (mint, cap, ETH sale)
├── scripts/
│   └── deploy.cjs        # Hardhat deploy script
├── test/
│   └── ZyncToken.test.cjs
└── hardhat.config.cjs
```

`ZyncToken.sol` is an ERC-20 with:

- A fixed `MAX_SUPPLY` cap
- Owner-controlled `mintTo` (treasury / airdrops)
- Public `mintWithEth` (payable mint at `mintPriceWei`)
- Owner `setMintPrice` and `withdraw` of sale proceeds
- `ReentrancyGuard` on payable functions

---

## Tasks

### Task 1 — Bug Fix & Hardening

Review `ZyncToken.sol` and fix issues in the minting logic:

- `setMintPrice(0)` currently bricks `mintWithEth` permanently (every call reverts with `ZeroAmount`)
- Add validation so the owner cannot set a zero price, **or** handle the zero-price case explicitly with a clear revert message
- Ensure `mintWithEth` still refunds excess ETH correctly when `msg.value` is not an exact multiple of the mint price
- Add or extend tests in `contracts/test/` for the edge cases above

---

### Task 2 — Token Burn

Extend `ZyncToken.sol`:

- Add `burn(uint256 amount)` so any holder can destroy their own tokens
- Add `burnFrom(address account, uint256 amount)` using the ERC-20 allowance mechanism
- Emit `Burned(address indexed from, uint256 amount)` on every burn
- Enforce `MAX_SUPPLY` semantics correctly (burned tokens should not count toward remaining mintable supply)
- Write tests covering: successful burn, burn exceeding balance, `burnFrom` with sufficient allowance, and `burnFrom` without allowance

---

### Task 3 — Events & Observability

Improve on-chain observability without changing core business logic:

- Emit indexed events for: mint price updates, treasury mints (`mintTo`), and ETH withdrawals
- Follow existing naming conventions and include relevant parameters (`previousPrice`, `newPrice`, `to`, `amount`, etc.)
- Add tests that assert events are emitted with the correct arguments (use Hardhat/Chai event matchers)

---

### Task 4 — New Contract: ZyncVesting

Add a new contract `ZyncVesting.sol` in `contracts/contracts/`:

- Accept ZYNC deposits from an owner/admin at construction or via a `fund()` function
- Allow the admin to create vesting schedules: `(beneficiary, amount, start, cliff, duration)`
- Beneficiaries call `release()` to claim vested tokens linearly after the cliff
- Prevent double-claiming and reentrancy on `release()`
- Write a deploy script update (or a separate `deploy-vesting.cjs`) and full test coverage in `contracts/test/ZyncVesting.test.cjs`

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile Solidity contracts |
| `npm run test:contracts` | Run Hardhat contract tests |
| `npm run chain` | Start local Hardhat node |
| `npm run deploy` | Deploy ZyncToken to localhost |
| `npm run dev` | Start Next.js dev server on port 3000 |
| `npm run client:build` | Production build |
| `npm run start` | Start production server |

---

## Evaluation Criteria

| Area | Weight |
|------|--------|
| Task 1 — Bug Fix & Hardening | 25% |
| Task 2 — Token Burn | 25% |
| Task 3 — Events & Observability | 20% |
| Task 4 — ZyncVesting | 30% |

You are also evaluated on:

- Solidity correctness and gas awareness
- Security practices (reentrancy, access control, input validation)
- Test coverage and edge-case handling
- Code clarity and consistency with the existing style
- Clear commit history and README notes

---

## Submission

- Do **not** open a PR to this repo — share your **fork URL**
- In your fork, update this `README.md` to explain:
  - How to compile and run your tests
  - Any security assumptions or known limitations
  - What you would improve or finish given more time
- Verify `npm install` → `npm run compile` → `npm run test:contracts` passes on a clean checkout
- If you ran the full app, confirm `npm run chain` → `npm run deploy` → `npm run dev` works end-to-end
