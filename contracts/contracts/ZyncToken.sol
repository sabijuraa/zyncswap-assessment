// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ZyncToken — ZYNC utility token
/// @notice Public mint: send ETH at `mintPriceWei` per one full token (18 decimals).
///         Owner can treasury-mint, set price, and withdraw sale proceeds.
///         Holders can burn their own tokens, or an approved amount via allowance.
/// @dev Pricing model: `mintPriceWei` is the wei cost of ONE full token (1e18 base
///      units). Purchases mint down to base-unit precision; ETH that cannot convert
///      into whole base units (truncation dust) is refunded.
/// @dev Price invariant: `mintPriceWei > 0` always, enforced at every write site.
/// @dev Supply invariant: MAX_SUPPLY caps the *lifetime* amount minted, tracked by
///      `totalMinted` (only ever increases). Burning lowers circulating supply but
///      never restores mintable headroom — burned tokens cannot be re-minted.
contract ZyncToken is ERC20, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;

    /// @dev One full token in base units; converts between wei price and token amount.
    uint256 private constant ONE_TOKEN = 10 ** 18;

    /// @notice Price in wei for one full ZYNC. Held to the > 0 invariant.
    uint256 public mintPriceWei;

    /// @notice Cumulative tokens ever minted. Only increases; unaffected by burns,
    ///         so mint -> burn -> mint can never exceed MAX_SUPPLY in aggregate.
    uint256 public totalMinted;

    error CapExceeded();
    error ZeroPrice();
    error NoPaymentSent();
    error MintAmountZero();
    error RefundFailed();
    error WithdrawFailed();
    error DirectPaymentRejected();

    /// @notice Emitted on every burn, alongside the ERC-20 transfer-to-zero event,
    ///         to give indexers an explicit, filterable burn signal.
    event Burned(address indexed from, uint256 amount);

    /// @notice Price change. Carries both old and new value so an indexer can
    ///         reconstruct the full price history without prior state.
    event MintPriceUpdated(uint256 previousPrice, uint256 newPrice);

    /// @notice Treasury / airdrop mint (no ETH involved). `to` indexed for filtering.
    event TreasuryMinted(address indexed to, uint256 amount);

    /// @notice Sale proceeds withdrawn to the owner. `to` indexed for filtering.
    event ProceedsWithdrawn(address indexed to, uint256 amount);

    constructor(uint256 initialMintPriceWei)
        ERC20("Zync", "ZYNC")
        Ownable(msg.sender)
    {
        // Enforce the price invariant from block zero: a zero-price deployment
        // would revert on every mint (division by zero in mintWithEth).
        if (initialMintPriceWei == 0) revert ZeroPrice();
        mintPriceWei = initialMintPriceWei;
        emit MintPriceUpdated(0, initialMintPriceWei); // initial price is auditable too
    }

    function setMintPrice(uint256 newPriceWei) external onlyOwner {
        if (newPriceWei == 0) revert ZeroPrice();
        uint256 previous = mintPriceWei; // cache before overwrite for the event
        mintPriceWei = newPriceWei;
        emit MintPriceUpdated(previous, newPriceWei);
    }

    /// @notice Tokens that may still be minted over the contract's lifetime.
    function remainingMintable() public view returns (uint256) {
        return MAX_SUPPLY - totalMinted;
    }

    /// @notice Treasury / airdrop mint. Counts against the lifetime cap.
    function mintTo(address to, uint256 amount) external onlyOwner {
        _mintCapped(to, amount);
        emit TreasuryMinted(to, amount);
    }

    /// @notice Buy ZYNC with native ETH at the current price.
    /// @dev Checks-effects-interactions; nonReentrant is defense in depth.
    function mintWithEth() external payable nonReentrant {
        if (msg.value == 0) revert NoPaymentSent();

        // Safe by the price invariant: mintPriceWei is guaranteed non-zero.
        uint256 tokenAmount = (msg.value * ONE_TOKEN) / mintPriceWei;
        if (tokenAmount == 0) revert MintAmountZero(); // payment below one base unit

        // Exact cost of the base units minted. Double flooring guarantees
        // costWei <= msg.value, so the refund below can never underflow.
        uint256 costWei = (tokenAmount * mintPriceWei) / ONE_TOKEN;

        _mintCapped(msg.sender, tokenAmount); // effect before interaction (CEI)

        uint256 refund = msg.value - costWei;
        if (refund > 0) {
            (bool ok, ) = payable(msg.sender).call{value: refund}("");
            if (!ok) revert RefundFailed();
        }
    }

    /// @notice Burn the caller's own tokens.
    /// @dev No external call, so no reentrancy surface and no guard needed.
    function burn(uint256 amount) external {
        _burn(msg.sender, amount); // reverts on insufficient balance
        emit Burned(msg.sender, amount);
    }

    /// @notice Burn `amount` from `account`, spending the caller's allowance.
    /// @dev Same allowance mechanism as transferFrom.
    function burnFrom(address account, uint256 amount) external {
        _spendAllowance(account, msg.sender, amount); // reverts on insufficient allowance
        _burn(account, amount);                        // reverts on insufficient balance
        emit Burned(account, amount);
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 amount = address(this).balance;
        (bool ok, ) = payable(owner()).call{value: amount}("");
        if (!ok) revert WithdrawFailed();
        emit ProceedsWithdrawn(owner(), amount);
    }

    /// @dev Reject bare ETH: all purchases must route through mintWithEth so the
    ///      price, cap, and refund logic apply.
    receive() external payable {
        revert DirectPaymentRejected();
    }

    /// @dev Single choke point for all minting. Caps against `totalMinted`, not
    ///      `totalSupply()`, so burns cannot reopen mint headroom.
    function _mintCapped(address to, uint256 amount) private {
        if (totalMinted + amount > MAX_SUPPLY) revert CapExceeded();
        totalMinted += amount;
        _mint(to, amount);
    }
}