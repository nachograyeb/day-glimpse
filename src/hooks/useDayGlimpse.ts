import { useProfile } from "@/contexts/ProfileContext";
import * as DayGlimpse from "../../artifacts/contracts/DayGlimpse.sol/DayGlimpse.json";

const contractAddress = "0x5a70bFDdcb76D47ca69f2A69b12a50b226b51403";
const abi = DayGlimpse.abi;

export const useDayGlimpse = () => {
  const { callContract, sendTransaction, walletConnected } = useProfile();

  const getDayGlimpse = async (profileAddress: string) => {
    try {
      if (!walletConnected) throw new Error("Wallet not connected");

      return await callContract(contractAddress, abi, "getDayGlimpse", [profileAddress]);
    } catch (error) {
      console.log(error);
      console.log("getDayGlimpse reverted. Returning null dayGlimpse data...");
      return null;
    }
  };

  const isExpired = async (profileAddress: string) => {
    if (!walletConnected) throw new Error("Wallet not connected");

    return await callContract(contractAddress, abi, "isExpired", [profileAddress]);
  };

  const testFunc = async () => {
    if (!walletConnected) throw new Error("Wallet not connected");

    return await callContract(contractAddress, abi, "testFunc", []);
  };

  const setDayGlimpse = async (storageHash: string, isPrivate: boolean) => {
    if (!walletConnected) throw new Error("Wallet not connected");
    const args = [
      storageHash,
      isPrivate,
    ];

    return await sendTransaction(contractAddress, abi, "setDayGlimpse", args);
  };

  const deleteDayGlimpse = async () => {
    if (!walletConnected) throw new Error("Wallet not connected");
    return await sendTransaction(contractAddress, abi, "deleteDayGlimpse", []);
  };

  return { getDayGlimpse, setDayGlimpse, deleteDayGlimpse, isExpired, testFunc };
}
