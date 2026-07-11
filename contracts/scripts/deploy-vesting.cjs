const hre = require("hardhat");

// Deploys ZyncVesting bound to an existing ZYNC token.
// Set ZYNC_TOKEN_ADDRESS in .env (printed by the ZyncToken deploy script).
async function main() {
  const tokenAddress = process.env.ZYNC_TOKEN_ADDRESS;
  if (!tokenAddress) {
    throw new Error("Set ZYNC_TOKEN_ADDRESS in .env before deploying the vesting contract");
  }

  const Vesting = await hre.ethers.getContractFactory("ZyncVesting");
  const vesting = await Vesting.deploy(tokenAddress);
  await vesting.waitForDeployment();

  console.log("ZyncVesting deployed to:", await vesting.getAddress());
  console.log("Bound to ZYNC token:", tokenAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});