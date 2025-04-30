import { useProfile } from "@/contexts/ProfileContext";
import contractData from "../../artifacts/contracts/DayGlimpse.sol/DayGlimpse.json";

const dayGlimpseAddress = process.env.NEXT_PUBLIC_DAYGLIMPSE_ADDRESS as string;
const abi = contractData.abi;

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
    try {
      return await sendTransaction(dayGlimpseAddress, abi, "mintNFT", [profileAddress, false, '0x']);
    } catch (error) {
      console.log(error);
      throw new Error("Either you already minted this NFT or an unknown error occurred");
    }
  }

  return { getDayGlimpse, setDayGlimpse, deleteDayGlimpse, isExpired, markExpired, mintNFT, };
}
