# ZyncSwap — Smart Contract Developer Assessment

My submission for the ZyncSwap assessment. All four tasks are implemented, with
Hardhat tests covering the token and the vesting contract.

Work is scoped to `contracts/` as the assessment instructed. The frontend and API
are left as provided; the setup section below explains how to run the whole project
locally so the dashboard connects to the deployed contract.

## What was done

**Task 1 — Bug fix and hardening.** Fixed the `setMintPrice(0)` bug that bricked
`mintWithEth` with a division by zero. I also closed the same gap in the
constructor, which set the price with no validation, so the "price is never zero"
rule holds from deployment and not only after the first setter call. I split the
overloaded `ZeroAmount` error into specific errors (`ZeroPrice`, `NoPaymentSent`,
`MintAmountZero`) so a failed mint tells you which condition it hit. I verified the
excess-ETH refund was already arithmetically correct (the double flooring keeps the
refund from underflowing) and pinned it down with a dust test.

**Task 2 — Token burn.** Added `burn` and `burnFrom` (the second one through the
standard allowance mechanism), each emitting a `Burned` event. The design decision
here is cap semantics: burning must not restore mintable supply. Because
OpenZeppelin's `_burn` lowers `totalSupply()`, a cap checked against `totalSupply`
would let someone mint the cap, burn, and mint again. I added a monotonic
`totalMinted` counter and gate all minting on it, so `MAX_SUPPLY` is a true lifetime
ceiling and burned tokens stay gone.

**Task 3 — Events and observability.** Added indexed events for the state-changing
admin actions: `MintPriceUpdated` (carrying both the old and new price so an indexer
can rebuild history without prior state), `TreasuryMinted`, and `ProceedsWithdrawn`.
The initial price is emitted from the constructor so the price log is complete from
the first block. Addresses are indexed for filtering; amounts and prices stay
unindexed because they are read, not filtered on.

**Task 4 — ZyncVesting.** A linear vesting contract with a cliff. The admin funds
the contract and creates schedules, and beneficiaries pull their vested tokens with
`release()`. It holds a solvency invariant (a schedule cannot be created unless the
funded balance backs it, so every beneficiary can always be paid), prevents
double-claiming with a per-schedule released counter, and keeps `release()`
reentrancy-safe through checks-effects-interactions plus a guard. It supports
multiple schedules per beneficiary, which matches how real cap tables work.

## Requirements

- Node.js 18 or newer
- npm

## Contracts: compile and test

From the repository root:

```bash
npm install
npm run compile
npm run test:contracts
```

The token and vesting tests run together. The vesting tests advance the local
network clock with `@nomicfoundation/hardhat-network-helpers` so the cliff and end
boundaries are checked against real block timestamps.

## Running the full project locally

The repository ships a Next.js frontend and API under `client/` alongside the
contracts. To see the dashboard connected to a live local contract, run the steps
below in order. Two terminals are needed because the local chain has to stay open.

**1. Install dependencies.** The contracts and the client have separate
`package.json` files, so install both:

```bash
# from the repository root (contracts + tooling)
npm install

# then the frontend
cd client
npm install
cd ..
```

**2. Set up environment variables.**

```bash
cp .env.example .env
```

The client also has its own example file; copy it too:

```bash
cd client
cp .env.local.example .env.local
cd ..
```

**3. Start a local chain (terminal 1).** Leave this running:

```bash
npm run chain
```

**4. Deploy the contracts (terminal 2).**

```bash
npm run deploy
```

Copy the deployed ZyncToken address that this prints, and paste it into `.env` as
`ZYNC_TOKEN_ADDRESS` (and into `client/.env.local` if the client reads its own copy;
check `client/.env.local.example` for the exact variable name). To deploy the
vesting contract as well:

```bash
npx hardhat run contracts/scripts/deploy-vesting.cjs
```

**5. Start the app (terminal 2).**

```bash
npm run dev
```

The dashboard should be available at `http://localhost:3000`.

If the dashboard does not load, the usual causes are: dependencies not installed in
`client/`, a missing or empty `.env` / `client/.env.local`, the local chain not
running in terminal 1, or the deployed token address not copied into the
environment file. The token address changes on every fresh `npm run chain`, so it
has to be updated after each restart.

## Security assumptions and known limitations

- **Trusted owner.** The token owner can set the price, treasury-mint up to the
  cap, and withdraw proceeds; the vesting owner can create schedules. This is the
  intended admin model for the assessment. For production I would move these behind
  a multisig and a timelock, because a single admin key is the largest trust
  assumption in the system.
- **`block.timestamp` for vesting.** Vesting timing reads `block.timestamp`.
  Validators can shift it by a few seconds, which is irrelevant at week and month
  vesting scales. I would not use it for anything needing second precision or
  randomness.
- **Vesting is irrevocable by design.** I chose not to add admin revocation of
  schedules. Revocable vesting reintroduces the trust problem vesting exists to
  remove, an admin able to claw back already-vested tokens. If the business needs
  revocation, I would limit it to unvested tokens, emit an event, and gate it behind
  a timelock.
- **Standard-ERC20 assumption.** The vesting contract uses `SafeERC20` and assumes
  a standard 18-decimal token (ZYNC). It is not hardened against fee-on-transfer or
  rebasing tokens, which would break the solvency accounting. That is a safe
  assumption given ZYNC is the known, fixed token.
- **Reentrancy.** Functions that make external calls (`mintWithEth`, `withdraw`,
  `release`) follow checks-effects-interactions and carry `nonReentrant` as defense
  in depth. `burn` and `burnFrom` make no external call, so they are not guarded; a
  guard there would only cost gas.

## What I would do with more time

- **Multisig and timelock for admin actions**, with a pause-only guardian role for
  emergencies. The guardian can halt minting but cannot move funds or change logic,
  which separates fast incident response from slow, auditable change.
- **Invariant and fuzz testing** (Foundry) on the two properties that must always
  hold: `totalMinted <= MAX_SUPPLY`, and `token.balanceOf(vesting) >=
  totalCommitted`. Unit tests cover the cases I thought of; fuzzing covers the ones
  I did not.
- **Gas benchmarks** (`hardhat-gas-reporter`) with before-and-after numbers on the
  hot paths (`mintWithEth`, `release`).
- **A batch `createSchedule`** to onboard many beneficiaries in one transaction
  during a distribution.