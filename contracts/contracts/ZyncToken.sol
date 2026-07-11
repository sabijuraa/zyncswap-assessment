// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ZyncToken — ZYNC utility token
/// @notice Public mint: send ETH at `mintPriceWei` per one full token (18 decimals).
///         Owner can treasury-mint, set price, and withdraw sale proceeds.
/// @dev Pricing model: `mintPriceWei` is the wei cost of ONE full token (1e18 base
///      units). Purchases mint down to base-unit precision; ETH that cannot convert
///      into whole base units (truncation dust) is refunded.
/// @dev Invariant: `mintPriceWei > 0` always. Enforced at every write site
///      (constructor and setter) so `mintWithEth` can divide by it unconditionally.
contract ZyncToken is ERC20, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;

    /// @dev One full token in base units; used to convert between wei price and token amount.
    uint256 private constant ONE_TOKEN = 10 ** 18;

    /// @notice Price in wei for one full ZYNC. Held to the > 0 invariant above.
    uint256 public mintPriceWei;

    error CapExceeded();
    error ZeroPrice();
    error NoPaymentSent();
    error MintAmountZero();
    error RefundFailed();
    error WithdrawFailed();
    error DirectPaymentRejected();

    constructor(uint256 initialMintPriceWei)
        ERC20("Zync", "ZYNC")
        Ownable(msg.sender)
    {
        // Enforce the price invariant from block zero: a contract deployed with a
        // zero price would revert on every mint (division by zero in mintWithEth).
        if (initialMintPriceWei == 0) revert ZeroPrice();
        mintPriceWei = initialMintPriceWei;
    }

    function setMintPrice(uint256 newPriceWei) external onlyOwner {
        // Same invariant as the constructor: never let the price reach zero.
        if (newPriceWei == 0) revert ZeroPrice();
        mintPriceWei = newPriceWei;
    }

    /// @notice Treasury / airdrop mint. Capped by MAX_SUPPLY.
    function mintTo(address to, uint256 amount) external onlyOwner {
        if (totalSupply() + amount > MAX_SUPPLY) revert CapExceeded();
        _mint(to, amount);
    }

    /// @notice Buy ZYNC with native ETH at the current price.
    /// @dev Follows checks-effects-interactions; nonReentrant is defense in depth.
    function mintWithEth() external payable nonReentrant {
        if (msg.value == 0) revert NoPaymentSent();

        // Safe by the price invariant: mintPriceWei is guaranteed non-zero.
        uint256 tokenAmount = (msg.value * ONE_TOKEN) / mintPriceWei;
        if (tokenAmount == 0) revert MintAmountZero(); // payment below one base unit
        if (totalSupply() + tokenAmount > MAX_SUPPLY) revert CapExceeded();

        // Exact cost of the whole base units minted. Double flooring guarantees
        // costWei <= msg.value, so the refund below can never underflow.
        uint256 costWei = (tokenAmount * mintPriceWei) / ONE_TOKEN;

        _mint(msg.sender, tokenAmount); // effect before interaction (CEI)

        uint256 refund = msg.value - costWei;
        if (refund > 0) {
            (bool ok, ) = payable(msg.sender).call{value: refund}("");
            if (!ok) revert RefundFailed();
        }
    }

    function withdraw() external onlyOwner nonReentrant {
        (bool ok, ) = payable(owner()).call{value: address(this).balance}("");
        if (!ok) revert WithdrawFailed();
    }

    /// @dev Reject bare ETH: all purchases must route through mintWithEth so the
    ///      price, cap, and refund logic apply.
    receive() external payable {
        revert DirectPaymentRejected();
    }
}