import { useProfile } from "@/contexts/ProfileContext";
import * as DayGlimpse from "../../artifacts/contracts/DayGlimpse.sol/DayGlimpse.json";

const dayGlimpseAddress = "0x6C600d10284D51fFE096Ee89FE76b24039A6f8dA"; // 24-hour stories
// const dayGlimpseAddress = "0x66BBE91Fd032B96c40aeB4c71b367c9829B66FE4"; //1-minute stories
const abi = DayGlimpse.abi;

export const useDayGlimpse = () => {
  const { callContract, sendTransaction, sendAppTransaction: sendTransactionDirectProvider, walletConnected } = useProfile();

  const getDayGlimpse = async (profileAddress: string) => {
    try {
      if (!walletConnected) throw new Error("Wallet not connected");

      return await callContract(dayGlimpseAddress, abi, "getDayGlimpse", [profileAddress]);
    } catch (error) {
      console.log(error);
      console.log("getDayGlimpse reverted. Returning null dayGlimpse data...");
      return null;
    }
  };

  const isExpired = async (profileAddress: string) => {
    if (!walletConnected) throw new Error("Wallet not connected");

    return await callContract(dayGlimpseAddress, abi, "isExpired", [profileAddress]);
  };

  const markExpired = async (profileAddress: string) => {
    if (!walletConnected) throw new Error("Wallet not connected");
    return await sendTransactionDirectProvider(dayGlimpseAddress, abi, "markExpired", [profileAddress]);
  };

  const setDayGlimpse = async (storageHash: string, isPrivate: boolean) => {
    if (!walletConnected) throw new Error("Wallet not connected");
    const args = [
      storageHash,
      isPrivate,
    ];

    return await sendTransaction(dayGlimpseAddress, abi, "setDayGlimpse", args);
  };

  const deleteDayGlimpse = async () => {
    if (!walletConnected) throw new Error("Wallet not connected");
    return await sendTransaction(dayGlimpseAddress, abi, "deleteDayGlimpse", []);
  };

  const mintNFT = async (profileAddress: string) => {
    if (!walletConnected) throw new Error("Wallet not connected");
    return await sendTransaction(dayGlimpseAddress, abi, "mintNFT", [profileAddress, false, '0x']);
  }

  return { getDayGlimpse, setDayGlimpse, deleteDayGlimpse, isExpired, markExpired, mintNFT, };
}
