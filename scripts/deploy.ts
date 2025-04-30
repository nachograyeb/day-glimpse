import { ethers } from "hardhat";
const NFT_NAME = "DayGlimpse NFT";
const NFT_SYMBOL = "DGNFT";

async function main() {
  const [owner] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();

  const DayGlimpse = await ethers.getContractFactory("DayGlimpse");
  const dayGlimpse = await DayGlimpse.deploy();
  const dayGlimpseAddress = await dayGlimpse.getAddress();
  await dayGlimpse.waitForDeployment();
  console.log("DayGlimpse deployed to:", dayGlimpseAddress);

  const DayGlimpseNFT = await ethers.getContractFactory("DayGlimpseNFT");
  const dayGlimpseNFT = await DayGlimpseNFT.deploy(NFT_NAME, NFT_SYMBOL, ownerAddress, dayGlimpseAddress);
  const dayGlimpseNFTAddress = await dayGlimpseNFT.getAddress();
  await dayGlimpseNFT.waitForDeployment();
  console.log("DayGlimpseNFT deployed to:", dayGlimpseNFTAddress);

  await dayGlimpse.setNFTContract(dayGlimpseNFTAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
