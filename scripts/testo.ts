import { ethers } from "ethers";
import * as DayGlimpse from "../artifacts/contracts/DayGlimpse.sol/DayGlimpse.json";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.hardhat") });

const contractAddress = "0x5a70bFDdcb76D47ca69f2A69b12a50b226b51403";
const abi = DayGlimpse.abi;
const provider = new ethers.JsonRpcProvider("https://rpc.testnet.lukso.network");

const main = async () => {
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
  const contract = new ethers.Contract(contractAddress, abi, provider);

  const storageHash = "0xc26fbfb43a5a67dcd83d84864749e6c20a0f89a0878ad7ce26f9f1b630a7f45c";
  const isPrivate = false;

  const tx = await contract.setDayGlimpse(storageHash, isPrivate);
  console.log("Transaction hash:", tx.hash);

  await tx.wait();
  console.log("Transaction confirmed");

  const myDayGlimpse = await contract.getDayGlimpse('0x2262eAaa276E84BdDFC93BC2030c03338C370808');
  console.log("Storage Hash:", myDayGlimpse.storageHash);
  console.log("Is Private:", myDayGlimpse.isPrivate);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
