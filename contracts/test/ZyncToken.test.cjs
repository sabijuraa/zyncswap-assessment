const { expect } = require("chai");
const hre = require("hardhat");

// ZyncToken test suite.
//
// Task 1 — price validation & ETH-refund correctness.
// Task 2 — burn / burnFrom, the Burned event, and lifetime-cap semantics.
// Task 3 — indexed admin events (price update, treasury mint, withdrawal).
//
// Price invariant: mintPriceWei > 0 at every write site (constructor + setter).
// Supply invariant: MAX_SUPPLY caps lifetime minting via totalMinted; burns never
// restore mintable headroom.

describe("ZyncToken", function () {
  const ONE_TOKEN = hre.ethers.parseEther("1"); // 1e18 base units = one full ZYNC
  const PRICE = hre.ethers.parseEther("0.001"); // wei cost of one full token

  async function deploy(price = PRICE) {
    const Z = await hre.ethers.getContractFactory("ZyncToken");
    const token = await Z.deploy(price);
    await token.waitForDeployment();
    return token;
  }

  // ============================ Task 1 ====================================

  it("mints ZYNC for ETH at the public price", async function () {
    const [, buyer] = await hre.ethers.getSigners();
    const token = await deploy();

    await (await token.connect(buyer).mintWithEth({ value: PRICE })).wait();

    expect(await token.balanceOf(buyer.address)).to.equal(ONE_TOKEN);
    // Exact payment for exactly one token leaves no dust: the contract keeps it all.
    expect(await hre.ethers.provider.getBalance(await token.getAddress())).to.equal(PRICE);
  });

  describe("mint price validation", function () {
    it("reverts when deployed with a zero price", async function () {
      const Z = await hre.ethers.getContractFactory("ZyncToken");
      // The price invariant must hold from construction, not just on update.
      await expect(Z.deploy(0)).to.be.revertedWithCustomError(Z, "ZeroPrice");
    });

    it("reverts when setMintPrice is called with zero", async function () {
      const token = await deploy();
      await expect(token.setMintPrice(0)).to.be.revertedWithCustomError(token, "ZeroPrice");
    });

    it("accepts a non-zero price update", async function () {
      const token = await deploy();
      const next = hre.ethers.parseEther("0.002");
      await token.setMintPrice(next);
      expect(await token.mintPriceWei()).to.equal(next);
    });

    it("restricts setMintPrice to the owner", async function () {
      const [, buyer] = await hre.ethers.getSigners();
      const token = await deploy();
      await expect(token.connect(buyer).setMintPrice(PRICE))
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });

  describe("mintWithEth", function () {
    it("reverts with NoPaymentSent when msg.value is zero", async function () {
      const [, buyer] = await hre.ethers.getSigners();
      const token = await deploy();
      await expect(token.connect(buyer).mintWithEth({ value: 0 }))
        .to.be.revertedWithCustomError(token, "NoPaymentSent");
    });

    it("reverts with MintAmountZero when payment is too small for one base unit", async function () {
      const [, buyer] = await hre.ethers.getSigners();
      // Price above 1e18 wei per token means 1 wei buys floor(1 * 1e18 / price) = 0
      // base units, so there is nothing to mint and the call must revert.
      const token = await deploy(hre.ethers.parseEther("2")); // 2e18 wei per full token
      await expect(token.connect(buyer).mintWithEth({ value: 1 }))
        .to.be.revertedWithCustomError(token, "MintAmountZero");
    });

    it("refunds truncation dust when the payment does not divide evenly", async function () {
      const [, buyer] = await hre.ethers.getSigners();
      const token = await deploy(hre.ethers.parseEther("0.003")); // awkward price → dust
      const payment = hre.ethers.parseEther("0.001");

      await (await token.connect(buyer).mintWithEth({ value: payment })).wait();

      const kept = await hre.ethers.provider.getBalance(await token.getAddress());
      // The contract keeps only the exact cost of the base units minted.
      expect(kept).to.be.lessThan(payment);
    });

    it("reverts with CapExceeded when a purchase would exceed MAX_SUPPLY", async function () {
      const [owner, buyer] = await hre.ethers.getSigners();
      const token = await deploy();
      await token.connect(owner).mintTo(owner.address, await token.MAX_SUPPLY());
      await expect(token.connect(buyer).mintWithEth({ value: PRICE }))
        .to.be.revertedWithCustomError(token, "CapExceeded");
    });
  });

  it("rejects direct ETH transfers via receive()", async function () {
    const [, buyer] = await hre.ethers.getSigners();
    const token = await deploy();
    await expect(buyer.sendTransaction({ to: await token.getAddress(), value: PRICE }))
      .to.be.revertedWithCustomError(token, "DirectPaymentRejected");
  });

  // ============================ Task 2 ====================================

  describe("burn and burnFrom", function () {
    async function deployWithBalance(amount) {
      const [owner, buyer] = await hre.ethers.getSigners();
      const token = await deploy();
      await token.connect(owner).mintTo(buyer.address, amount);
      return { token, owner, buyer };
    }

    it("burns the caller's own tokens and emits Burned", async function () {
      const amount = hre.ethers.parseEther("100");
      const { token, buyer } = await deployWithBalance(amount);

      await expect(token.connect(buyer).burn(amount))
        .to.emit(token, "Burned")
        .withArgs(buyer.address, amount);

      expect(await token.balanceOf(buyer.address)).to.equal(0n);
      expect(await token.totalSupply()).to.equal(0n);
    });

    it("reverts when burning more than the balance", async function () {
      const amount = hre.ethers.parseEther("100");
      const { token, buyer } = await deployWithBalance(amount);
      await expect(token.connect(buyer).burn(amount + 1n))
        .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("burnFrom spends the allowance and emits Burned", async function () {
      const amount = hre.ethers.parseEther("100");
      const { token, owner, buyer } = await deployWithBalance(amount);

      await token.connect(buyer).approve(owner.address, amount);

      await expect(token.connect(owner).burnFrom(buyer.address, amount))
        .to.emit(token, "Burned")
        .withArgs(buyer.address, amount);

      expect(await token.balanceOf(buyer.address)).to.equal(0n);
      expect(await token.allowance(buyer.address, owner.address)).to.equal(0n);
    });

    it("burnFrom reverts without sufficient allowance", async function () {
      const amount = hre.ethers.parseEther("100");
      const { token, owner, buyer } = await deployWithBalance(amount);
      await expect(token.connect(owner).burnFrom(buyer.address, amount))
        .to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });

    it("burned tokens do not restore mintable headroom (lifetime cap)", async function () {
      const [owner, buyer] = await hre.ethers.getSigners();
      const token = await deploy();
      const cap = await token.MAX_SUPPLY();

      await token.connect(owner).mintTo(buyer.address, cap);
      await token.connect(buyer).burn(cap / 2n);

      // Circulating supply dropped, but totalMinted is unchanged, so no more mint.
      expect(await token.totalSupply()).to.equal(cap / 2n);
      expect(await token.totalMinted()).to.equal(cap);
      expect(await token.remainingMintable()).to.equal(0n);
      await expect(token.connect(owner).mintTo(buyer.address, 1n))
        .to.be.revertedWithCustomError(token, "CapExceeded");
    });
  });

  // ============================ Task 3 ====================================

  describe("observability events", function () {
    it("emits MintPriceUpdated at construction with previous price 0", async function () {
      const Z = await hre.ethers.getContractFactory("ZyncToken");
      const token = await Z.deploy(PRICE);
      await token.waitForDeployment();
      await expect(token.deploymentTransaction())
        .to.emit(token, "MintPriceUpdated")
        .withArgs(0n, PRICE);
    });

    it("emits MintPriceUpdated with previous and new price on update", async function () {
      const token = await deploy();
      const next = hre.ethers.parseEther("0.005");
      await expect(token.setMintPrice(next))
        .to.emit(token, "MintPriceUpdated")
        .withArgs(PRICE, next);
    });

    it("emits TreasuryMinted on mintTo", async function () {
      const [owner, buyer] = await hre.ethers.getSigners();
      const token = await deploy();
      const amount = hre.ethers.parseEther("1000");
      await expect(token.connect(owner).mintTo(buyer.address, amount))
        .to.emit(token, "TreasuryMinted")
        .withArgs(buyer.address, amount);
    });

    it("emits ProceedsWithdrawn with the withdrawn amount", async function () {
      const [owner, buyer] = await hre.ethers.getSigners();
      const token = await deploy();
      await token.connect(buyer).mintWithEth({ value: PRICE });
      await expect(token.connect(owner).withdraw())
        .to.emit(token, "ProceedsWithdrawn")
        .withArgs(owner.address, PRICE);
    });
  });
});