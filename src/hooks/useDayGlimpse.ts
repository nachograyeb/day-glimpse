import { useProfile } from "@/contexts/ProfileContext";
import contractData from "../../artifacts/contracts/DayGlimpse.sol/DayGlimpse.json";

const dayGlimpseAddress = process.env.NEXT_PUBLIC_DAYGLIMPSE_ADDRESS as string;
const abi = contractData.abi;

export const useDayGlimpse = () => {
  const { callContract, sendTransaction, sendAppTransaction, sendTransactionLowLevel, walletConnected } = useProfile();

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
    return await sendAppTransaction(dayGlimpseAddress, abi, "markExpired", [profileAddress]);
  };

  const setDayGlimpse = async (storageHash: string, isPrivate: boolean) => {
    if (!walletConnected) throw new Error("Wallet not connected");
    const args = [
      storageHash,
      isPrivate,
    ];

    return await sendTransactionLowLevel(dayGlimpseAddress, abi, "setDayGlimpse", args);
  };

  const deleteDayGlimpse = async () => {
    if (!walletConnected) throw new Error("Wallet not connected");
    return await sendTransactionLowLevel(dayGlimpseAddress, abi, "deleteDayGlimpse", []);
  };

  const mintNFT = async (profileAddress: string) => {
    if (!walletConnected) throw new Error("Wallet not connected");
    try {
      return await sendTransactionLowLevel(dayGlimpseAddress, abi, "mintNFT", [profileAddress, false, '0x']);
    } catch (error) {
      console.log(error);
      throw new Error("Either you already minted this NFT or an unknown error occurred");
    }
  }

  const areMutualFollowers = async (profileAddress: string, profileViewerAddress: string) => {
    try {
      console.log("Calling areMutualFollowers...");
      if (!walletConnected) throw new Error("Wallet not connected");
      return await callContract(dayGlimpseAddress, abi, "areMutualFollowers", [profileAddress, profileViewerAddress]);
    } catch (error) {
      console.log(error);
      console.log("areMutualFollowers reverted. Returning false...");
      return false;
    }
  }

  return { getDayGlimpse, setDayGlimpse, deleteDayGlimpse, isExpired, markExpired, mintNFT, areMutualFollowers };
}
