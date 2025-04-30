import { useProfile } from "@/contexts/ProfileContext";
import * as DayGlimpse from "../../artifacts/contracts/DayGlimpse.sol/DayGlimpse.json";

const dayGlimpseAddress = "0x3De1D1b6dfE28641e90Ea8A30e0463731e2D6D18"; // 24-hour stories
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
    try {
      return await sendTransaction(dayGlimpseAddress, abi, "mintNFT", [profileAddress, false, '0x']);
    } catch (error) {
      console.log(error);
      throw new Error("Either you already minted this NFT or an unknown error occurred");
    }
  }

  return { getDayGlimpse, setDayGlimpse, deleteDayGlimpse, isExpired, markExpired, mintNFT, };
}
