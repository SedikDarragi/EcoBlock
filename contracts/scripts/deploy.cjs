const hre = require("hardhat");

async function main() {
  const EnergyMarket = await hre.ethers.getContractFactory("EnergyMarket");
  const energyMarket = await EnergyMarket.deploy();

  await energyMarket.waitForDeployment();
  
  console.log("EnergyMarket deployed to:", await energyMarket.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});