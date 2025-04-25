import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();
  const ownerAddress = await owner.getAddress();

  const DayGlimpse = await ethers.getContractFactory("DayGlimpse");
  const dayGlimpse = await DayGlimpse.deploy();
  const dayGlimpseAddress = await dayGlimpse.getAddress();
  await dayGlimpse.waitForDeployment();

  await dayGlimpse.connect(owner).setDayGlimpse(
    '0xc26fbfb43a5a67dcd83d84864749e6c20a0f89a0878ad7ce26f9f1b630a7f45c',
    Date.now(),
    false,
  );

  const myDayGlimpse = await dayGlimpse.getDayGlimpse(
    ownerAddress,
  );

  console.log(myDayGlimpse.storageHash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
