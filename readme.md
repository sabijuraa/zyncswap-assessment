# ZyncSwap — Smart Contract Developer Assessment

My submission for the ZyncSwap assessment. All four tasks are complete, with full
Hardhat test coverage and incremental, per-task commit history.

Work is confined to `contracts/` as instructed; the frontend and API are untouched.

## What was done

**Task 1 — Bug fix & hardening.** Fixed the `setMintPrice(0)` bug that bricked
`mintWithEth` (division by zero). Went further and closed the *same* hole in the
constructor, which set the price with no validation — so the "price is never zero"
rule now holds from deployment, not just after the first setter call. Split the
overloaded `ZeroAmount` error into specific, diagnosable errors (`ZeroPrice`,
`NoPaymentSent`, `MintAmountZero`) so a failed mint tells you *why* it failed.
Verified the excess-ETH refund was already arithmetically correct (double flooring
guarantees the refund can never underflow) and pinned it down with a dust test.

**Task 2 — Token burn.** Added `burn` and `burnFrom` (the latter via the standard
allowance mechanism), each emitting an explicit `Burned` event. The important
decision here is cap semantics: burning must *not* restore mintable supply. Since
OpenZeppelin's `_burn` lowers `totalSupply()`, a `totalSupply`-based cap would let
you mint the cap, burn, and mint again. I added a monotonic `totalMinted` counter
and gate all minting on it, so `MAX_SUPPLY` is a true lifetime ceiling and burned
tokens are permanently gone.

**Task 3 — Events & observability.** Added indexed events for the state-changing
admin actions: `MintPriceUpdated` (carries both previous and new price so an
indexer can reconstruct history without prior state), `TreasuryMinted`, and
`ProceedsWithdrawn`. The initial price is emitted from the constructor so the price
log is complete from block zero. Addresses are indexed for filtering; amounts and
prices are left unindexed since they're read, not filtered on.

**Task 4 — ZyncVesting.** A linear vesting contract with a cliff. The admin funds
the contract and creates schedules; beneficiaries pull vested tokens via
`release()`. Key properties: a solvency invariant (a schedule can't be created
unless the funded balance backs it, so every beneficiary can always be paid),
double-claim prevention via a per-schedule released counter, and reentrancy-safe
release (checks-effects-interactions plus a guard). Supports multiple schedules
per beneficiary, matching real cap tables.

## Compile and test

Requires Node.js 18+.

```bash
npm install
npm run compile
npm run test:contracts
```

All tests run together (token + vesting). The vesting tests advance the network
clock with `@nomicfoundation/hardhat-network-helpers` to test the cliff and end
boundaries against real timestamps.

## Run the full app (optional)

```bash
cp .env.example .env
npm run chain          # terminal 1: local Hardhat node
npm run deploy         # terminal 2: deploy ZyncToken, copy address into .env
npm run deploy:vesting # optional: deploy ZyncVesting (needs ZYNC_TOKEN_ADDRESS)
npm run dev            # → http://localhost:3000
```

(If `deploy:vesting` isn't wired as an npm script, run
`npx hardhat run contracts/scripts/deploy-vesting.cjs`.)

## Security assumptions & known limitations

- **Trusted owner.** The token owner can set price, treasury-mint up to the cap,
  and withdraw proceeds; the vesting owner can create schedules. This is the
  intended admin model for the assessment. For production I would move these
  behind a multisig and a timelock (see below), because a single admin key is the
  largest trust assumption in the system.
- **`block.timestamp` for vesting.** Vesting timing uses `block.timestamp`.
  Validators can skew it by a few seconds, which is irrelevant at week/month
  vesting scales. I would not use it for anything requiring second precision or
  randomness.
- **Vesting is irrevocable by design.** I deliberately did *not* add admin
  revocation of schedules. Revocable vesting reintroduces the trust problem vesting
  exists to remove — an admin able to claw back already-vested tokens. If the
  business genuinely needs revocation, I would scope it strictly to *unvested*
  tokens, emit an event, and gate it behind a timelock.
- **Standard-ERC20 assumption.** The vesting contract uses `SafeERC20` and is
  designed around a standard 18-decimal token (ZYNC). It is not hardened against
  fee-on-transfer or rebasing tokens, which would break the solvency accounting;
  that's an acceptable assumption given ZYNC is the known, fixed token.
- **Reentrancy.** Functions that make external calls (`mintWithEth`, `withdraw`,
  `release`) follow checks-effects-interactions and carry `nonReentrant` as
  defense in depth. Functions with no external call (`burn`, `burnFrom`) are not
  guarded, since there is no reentrancy surface and a guard would only waste gas.

## What I'd do with more time

- **Multisig + timelock for admin actions**, with a pause-only guardian role for
  emergencies: the guardian can halt (pause minting) but cannot move funds or
  change logic, which separates fast incident response from slow, auditable change.
- **Invariant / fuzz testing** (Foundry) on the two properties that must always
  hold: `totalMinted <= MAX_SUPPLY`, and `token.balanceOf(vesting) >=
  totalCommitted`. Unit tests cover the cases I imagined; fuzzing covers the ones
  I didn't.
- **Gas benchmarks** (`hardhat-gas-reporter`) with before/after numbers on the
  hot paths (`mintWithEth`, `release`).
- **A batch `createSchedule`** for onboarding many beneficiaries in one transaction
  during a token distribution.