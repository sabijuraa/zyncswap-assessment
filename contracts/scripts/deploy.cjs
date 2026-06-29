const hre = require("hardhat");

// Default: 0.0001 ETH per 1 ZYNC (1e18 token wei)
const DEFAULT_MINT_PRICE = hre.ethers.parseEther("0.0001");

async function main() {
  const price =
    process.env.MINT_PRICE_WEI !== undefined && process.env.MINT_PRICE_WEI !== ""
      ? BigInt(process.env.MINT_PRICE_WEI)
      : DEFAULT_MINT_PRICE;

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Zync = await hre.ethers.getContractFactory("ZyncToken");
  const token = await Zync.deploy(price);
  await token.waitForDeployment();
  const addr = await token.getAddress();
  console.log("ZyncToken:", addr);
  console.log("mintPriceWei:", price.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
