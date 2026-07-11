// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ZyncToken — ZYNC utility token
/// @notice Public mint: send ETH at `mintPriceWei` per one full token (18 decimals).
///         Owner can treasury-mint, set price, and withdraw sale proceeds.
///         Holders can burn their own tokens, or an approved amount via allowance.
/// @dev Price invariant: `mintPriceWei > 0` always, enforced at every write site.
/// @dev Supply invariant: MAX_SUPPLY caps the lifetime amount minted, tracked by
///      `totalMinted` (only ever increases). Burning lowers circulating supply but
///      never restores mintable headroom.
contract ZyncToken is ERC20, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;
    uint256 private constant ONE_TOKEN = 10 ** 18;

    /// @notice Price in wei for one full ZYNC. Held to the > 0 invariant.
    uint256 public mintPriceWei;

    /// @notice Cumulative tokens ever minted; only increases, unaffected by burns.
    uint256 public totalMinted;

    error CapExceeded();
    error ZeroPrice();
    error NoPaymentSent();
    error MintAmountZero();
    error RefundFailed();
    error WithdrawFailed();
    error DirectPaymentRejected();

    event Burned(address indexed from, uint256 amount);
    event MintPriceUpdated(uint256 previousPrice, uint256 newPrice);
    event TreasuryMinted(address indexed to, uint256 amount);
    event ProceedsWithdrawn(address indexed to, uint256 amount);

    constructor(uint256 initialMintPriceWei)
        ERC20("Zync", "ZYNC")
        Ownable(msg.sender)
    {
        if (initialMintPriceWei == 0) revert ZeroPrice();
        mintPriceWei = initialMintPriceWei;
        emit MintPriceUpdated(0, initialMintPriceWei);
    }

    function setMintPrice(uint256 newPriceWei) external onlyOwner {
        if (newPriceWei == 0) revert ZeroPrice();
        uint256 previous = mintPriceWei;
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

        uint256 tokenAmount = (msg.value * ONE_TOKEN) / mintPriceWei;
        if (tokenAmount == 0) revert MintAmountZero();

        uint256 costWei = (tokenAmount * mintPriceWei) / ONE_TOKEN;

        _mintCapped(msg.sender, tokenAmount);

        uint256 refund = msg.value - costWei;
        if (refund > 0) {
            (bool ok, ) = payable(msg.sender).call{value: refund}("");
            if (!ok) revert RefundFailed();
        }
    }

    /// @notice Burn the caller's own tokens.
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit Burned(msg.sender, amount);
    }

    /// @notice Burn `amount` from `account`, spending the caller's allowance.
    function burnFrom(address account, uint256 amount) external {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
        emit Burned(account, amount);
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 amount = address(this).balance;
        (bool ok, ) = payable(owner()).call{value: amount}("");
        if (!ok) revert WithdrawFailed();
        emit ProceedsWithdrawn(owner(), amount);
    }

    /// @dev Reject bare ETH: all purchases must route through mintWithEth.
    receive() external payable {
        revert DirectPaymentRejected();
    }

    /// @dev Single choke point for all minting. Caps against `totalMinted`.
    function _mintCapped(address to, uint256 amount) private {
        if (totalMinted + amount > MAX_SUPPLY) revert CapExceeded();
        totalMinted += amount;
        _mint(to, amount);
    }
}