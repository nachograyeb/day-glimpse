import { ethers } from "hardhat";

[owner] = await ethers.getSigners();
ownerAddress = await owner.getAddress();

const DayGlimpse = await ethers.getContractFactory("DayGlimpse");
const dayGlimpse = await DayGlimpse.deploy();
const dayGlimpseAddress = await dayGlimpse.getAddress();
await dayGlimpse.waitForDeployment();

await dayGlimpse.connect(owner).setDayGlimpse(
  'c26fbfb43a5a67dcd83d84864749e6c20a0f89a0878ad7ce26f9f1b630a7f45c',
  Date.now(),
  false,
);

const myDayGlimpse = await dayGlimpse.getDayGlimpse(
  ownerAddress,
);

console.log("DayGlimpse deployed to:", dayGlimpseAddress);
