// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ZyncToken — ZYNC utility token for AureLexa (Zync)
/// @notice Public mint: send ETH at `mintPriceWei` per 1 full token (18 decimals).
///         Owner can treasury-mint, set price, and withdraw sale proceeds.
contract ZyncToken is ERC20, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;

    /// Price in wei for 1e18 wei of tokens (one full ZYNC with 18 decimals).
    uint256 public mintPriceWei;

    error CapExceeded();
    error ZeroAmount();

    constructor(uint256 initialMintPriceWei) ERC20("Zync", "ZYNC") Ownable(msg.sender) {
        mintPriceWei = initialMintPriceWei;
    }

    function setMintPrice(uint256 newPriceWei) external onlyOwner {
        mintPriceWei = newPriceWei;
    }

    /// @notice Treasury / airdrops — does not require ETH; capped by MAX_SUPPLY.
    function mintTo(address to, uint256 amount) external onlyOwner {
        if (totalSupply() + amount > MAX_SUPPLY) revert CapExceeded();
        _mint(to, amount);
    }

    /// @notice Buy ZYNC with native currency on the same chain.
    function mintWithEth() external payable nonReentrant {
        if (mintPriceWei == 0) revert ZeroAmount();
        if (msg.value == 0) revert ZeroAmount();

        uint256 tokenAmount = (msg.value * 10 ** 18) / mintPriceWei;
        if (tokenAmount == 0) revert ZeroAmount();
        if (totalSupply() + tokenAmount > MAX_SUPPLY) revert CapExceeded();

        uint256 costWei = (tokenAmount * mintPriceWei) / 10 ** 18;
        _mint(msg.sender, tokenAmount);

        uint256 refund = msg.value - costWei;
        if (refund > 0) {
            (bool ok, ) = payable(msg.sender).call{value: refund}("");
            require(ok, "refund failed");
        }
    }

    function withdraw() external onlyOwner nonReentrant {
        (bool ok, ) = payable(owner()).call{value: address(this).balance}("");
        require(ok, "withdraw failed");
    }

    receive() external payable {
        revert("use mintWithEth");
    }
}
