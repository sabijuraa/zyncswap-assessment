const { expect } = require("chai");
const hre = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

// ZyncVesting — linear vesting with a cliff.
//
// Solvency invariant: the contract's token balance always covers the sum of
// unreleased allocations, so no schedule can be created it cannot honour.
// Vesting model: nothing before cliff; at cliff the amount accrued since start
// unlocks at once; then linear to start + duration.

describe("ZyncVesting", function () {
  const DAY = 24 * 60 * 60;
  const PRICE = hre.ethers.parseEther("0.001");
  const GRANT = hre.ethers.parseEther("1000");

  async function deployFunded(funded = GRANT) {
    const [owner, beneficiary, other] = await hre.ethers.getSigners();

    const Token = await hre.ethers.getContractFactory("ZyncToken");
    const token = await Token.deploy(PRICE);
    await token.waitForDeployment();

    const Vesting = await hre.ethers.getContractFactory("ZyncVesting");
    const vesting = await Vesting.deploy(await token.getAddress());
    await vesting.waitForDeployment();

    // Owner mints itself tokens, approves, and funds the vesting contract.
    await token.mintTo(owner.address, funded);
    await token.approve(await vesting.getAddress(), funded);
    await vesting.fund(funded);

    return { token, vesting, owner, beneficiary, other };
  }

  it("rejects construction with the zero token address", async function () {
    const Vesting = await hre.ethers.getContractFactory("ZyncVesting");
    await expect(Vesting.deploy(hre.ethers.ZeroAddress))
      .to.be.revertedWithCustomError(Vesting, "ZeroAddress");
  });

  describe("createSchedule", function () {
    it("creates a fully-backed schedule and emits ScheduleCreated", async function () {
      const { vesting, beneficiary } = await deployFunded();
      const start = (await time.latest()) + DAY;

      await expect(
        vesting.createSchedule(beneficiary.address, GRANT, start, start + 30 * DAY, 365 * DAY)
      )
        .to.emit(vesting, "ScheduleCreated")
        .withArgs(beneficiary.address, 0, GRANT, start, start + 30 * DAY, 365 * DAY);

      expect(await vesting.totalCommitted()).to.equal(GRANT);
    });

    it("reverts when an allocation exceeds the unallocated balance", async function () {
      const { vesting, beneficiary } = await deployFunded(GRANT);
      const start = await time.latest();
      await vesting.createSchedule(beneficiary.address, GRANT, start, start, 100 * DAY);
      await expect(
        vesting.createSchedule(beneficiary.address, 1n, start, start, 100 * DAY)
      ).to.be.revertedWithCustomError(vesting, "InsufficientFunds");
    });

    it("reverts on invalid cliff or duration", async function () {
      const { vesting, beneficiary } = await deployFunded();
      const start = await time.latest();
      await expect(
        vesting.createSchedule(beneficiary.address, GRANT, start, start, 0)
      ).to.be.revertedWithCustomError(vesting, "InvalidSchedule");
      await expect(
        vesting.createSchedule(beneficiary.address, GRANT, start, start + 200 * DAY, 100 * DAY)
      ).to.be.revertedWithCustomError(vesting, "InvalidSchedule");
    });

    it("restricts schedule creation to the owner", async function () {
      const { vesting, beneficiary, other } = await deployFunded();
      const start = await time.latest();
      await expect(
        vesting.connect(other).createSchedule(beneficiary.address, GRANT, start, start, 100 * DAY)
      ).to.be.revertedWithCustomError(vesting, "OwnableUnauthorizedAccount");
    });
  });

  describe("vesting curve", function () {
    async function withSchedule() {
      const ctx = await deployFunded();
      const start = await time.latest();
      const cliff = start + 90 * DAY;
      const duration = 360 * DAY;
      await ctx.vesting.createSchedule(ctx.beneficiary.address, GRANT, start, cliff, duration);
      return { ...ctx, start, cliff, duration };
    }

    it("releases nothing before the cliff", async function () {
      const { vesting, beneficiary } = await withSchedule();
      await time.increase(30 * DAY);
      expect(await vesting.releasable(beneficiary.address, 0)).to.equal(0n);
      await expect(vesting.connect(beneficiary).release(0))
        .to.be.revertedWithCustomError(vesting, "NothingToRelease");
    });

    it("unlocks the amount accrued since start once the cliff is reached", async function () {
      const { vesting, beneficiary } = await withSchedule();
      await time.increase(90 * DAY); // 90 of 360 days accrued
      expect(await vesting.releasable(beneficiary.address, 0))
        .to.be.closeTo(GRANT / 4n, hre.ethers.parseEther("1"));
    });

    it("accrues linearly between the cliff and the end", async function () {
      const { vesting, beneficiary } = await withSchedule();
      await time.increase(180 * DAY);
      expect(await vesting.releasable(beneficiary.address, 0))
        .to.be.closeTo(GRANT / 2n, hre.ethers.parseEther("1"));
    });

    it("vests the full amount once the duration ends", async function () {
      const { vesting, beneficiary } = await withSchedule();
      await time.increase(400 * DAY);
      expect(await vesting.releasable(beneficiary.address, 0)).to.equal(GRANT);
    });
  });

  describe("release", function () {
    async function withSchedule() {
      const ctx = await deployFunded();
      const start = await time.latest();
      await ctx.vesting.createSchedule(ctx.beneficiary.address, GRANT, start, start, 360 * DAY);
      return { ...ctx, start };
    }

    it("transfers the vested tokens and emits Released", async function () {
      const { token, vesting, beneficiary } = await withSchedule();
      await time.increase(360 * DAY);

      await expect(vesting.connect(beneficiary).release(0))
        .to.emit(vesting, "Released")
        .withArgs(beneficiary.address, 0, GRANT);

      expect(await token.balanceOf(beneficiary.address)).to.equal(GRANT);
      expect(await vesting.totalCommitted()).to.equal(0n);
    });

    it("prevents double-claiming when nothing new has vested", async function () {
      const { vesting, beneficiary } = await withSchedule();
      await time.increase(360 * DAY);
      await vesting.connect(beneficiary).release(0);
      await expect(vesting.connect(beneficiary).release(0))
        .to.be.revertedWithCustomError(vesting, "NothingToRelease");
    });

    it("pays only the newly-vested delta across successive claims", async function () {
      const { token, vesting, beneficiary } = await withSchedule();

      await time.increase(180 * DAY);
      await vesting.connect(beneficiary).release(0);
      expect(await token.balanceOf(beneficiary.address))
        .to.be.closeTo(GRANT / 2n, hre.ethers.parseEther("2"));

      await time.increase(180 * DAY);
      await vesting.connect(beneficiary).release(0);
      expect(await token.balanceOf(beneficiary.address)).to.equal(GRANT);
    });

    it("reverts when releasing a schedule that does not exist", async function () {
      const { vesting, beneficiary } = await withSchedule();
      await expect(vesting.connect(beneficiary).release(5))
        .to.be.revertedWithCustomError(vesting, "NoSuchSchedule");
    });
  });
});