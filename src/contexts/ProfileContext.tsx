'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClientUPProvider } from '@lukso/up-provider'
import { type Eip1193Provider, ethers } from 'ethers'

interface ProfileContextType {
  chainId: number;
  accounts: Array<`0x${string}`>;
  contextAccounts: Array<`0x${string}`>;
  walletConnected: boolean;
  error: string;
  provider: any;
  browserProvider: ethers.BrowserProvider | null;
  isOwner: boolean;
  profileAddress: string | null;
  signer: ethers.JsonRpcSigner | null;
  callContract: (contractAddress: string, abi: any[], method: string, args: any[]) => Promise<any>;
  sendTransaction: (contractAddress: string, abi: any[], method: string, args: any[], options?: any) => Promise<ethers.TransactionResponse>;
  sendAppTransaction: (contractAddress: string, abi: any[], method: string, args: any[], options?: any) => Promise<any>;
  sendTransactionLowLevel: (contractAddress: string, abi: any[], method: string, args: any[], options?: any) => Promise<ethers.TransactionReceipt>;
}

interface EnhancedTransactionResponse extends ethers.TransactionResponse {
  waitForConfirmation: (confirmations?: number, timeoutSeconds?: number) => Promise<ethers.TransactionReceipt>;
  getReceipt: (timeoutSeconds?: number) => Promise<ethers.TransactionReceipt>;
  isPending: () => Promise<boolean>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [chainId, setChainId] = useState<number>(0)
  const [accounts, setAccounts] = useState<Array<`0x${string}`>>([])
  const [contextAccounts, setContextAccounts] = useState<Array<`0x${string}`>>([])
  const [walletConnected, setWalletConnected] = useState(false)
  const [error, setError] = useState('')
  const [provider, setProvider] = useState<any>(null)
  const [browserProvider, setBrowserProvider] = useState<ethers.BrowserProvider | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [profileAddress, setProfileAddress] = useState<string | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [directProvider, setDirectProvider] = useState<ethers.JsonRpcProvider | null>(null);

  const updateConnected = useCallback((accounts: Array<`0x${string}`>, contextAccounts: Array<`0x${string}`>, chainId: number) => {
    setWalletConnected(accounts.length > 0 && contextAccounts.length > 0)

    if (contextAccounts.length > 0) {
      setProfileAddress(contextAccounts[0]);
    }

    if (accounts.length > 0 && contextAccounts.length > 0) {
      const isOwner = accounts[0].toLowerCase() === contextAccounts[0].toLowerCase();
      setIsOwner(isOwner);
    } else {
      setIsOwner(false);
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const _provider = createClientUPProvider()
        const _browserProvider = new ethers.BrowserProvider(_provider as unknown as Eip1193Provider)
        setProvider(_provider)
        setBrowserProvider(_browserProvider)

        const _directProvider = new ethers.JsonRpcProvider('https://rpc.testnet.lukso.network');
        setDirectProvider(_directProvider);

        const parentProfileAddress = localStorage.getItem('parentProfileAddress');
        if (parentProfileAddress) {
          console.log('Found stored parent profile address:', parentProfileAddress);
        }

      } catch (err) {
        console.error('Failed to create provider:', err)
      }
    }
  }, [])

  useEffect(() => {
    if (!browserProvider || !provider) return;

    async function init() {
      if (!browserProvider || !provider) return;
      try {
        const network = await browserProvider.getNetwork()
        const _chainId = Number(network.chainId)
        setChainId(_chainId)

        const _signer = await browserProvider.getSigner()
        setSigner(_signer)

        const _accounts = [await _signer.getAddress()] as Array<`0x${string}`>
        setAccounts(_accounts)

        const _contextAccounts = provider.contextAccounts
        updateConnected(_accounts, _contextAccounts, _chainId)
      } catch (error) {
        console.log(error);
      }
    }
    init()

    const accountsChanged = (_accounts: Array<`0x${string}`>) => {
      setAccounts(_accounts)
      updateConnected(_accounts, contextAccounts, chainId)
    }

    const contextAccountsChanged = (_accounts: Array<`0x${string}`>) => {
      setContextAccounts(_accounts)
      updateConnected(accounts, _accounts, chainId)
    }

    const chainChanged = (_chainId: string | number) => {
      const chainIdNumber = typeof _chainId === 'string' ? parseInt(_chainId, 16) : _chainId
      setChainId(chainIdNumber)
      updateConnected(accounts, contextAccounts, chainIdNumber)
    }

    provider.on('accountsChanged', accountsChanged)
    provider.on('chainChanged', chainChanged)

    if (provider && provider.on) {
      provider.on('contextAccountsChanged', contextAccountsChanged)
    }

    return () => {
      provider.off('accountsChanged', accountsChanged)
      provider.off('chainChanged', chainChanged)
      if (provider && provider.off) {
        provider.off('contextAccountsChanged', contextAccountsChanged)
      }
    }
  }, [browserProvider, provider, chainId, accounts, contextAccounts, updateConnected])

  const callContract = useCallback(async (contractAddress: string, abi: any[], method: string, args: any[]) => {
    if (!provider || !accounts[0]) throw new Error('No provider or profile address available');
    if (!signer) throw new Error('No signer available');

    try {
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const data = contract.interface.encodeFunctionData(method, args);

      const response = await provider.request({
        method: 'eth_call',
        params: [
          {
            to: contractAddress,
            data,
            from: accounts[0],
          },
          'latest'
        ]
      });

      let result;
      if (typeof response === 'object' && response !== null && 'result' in response) {
        result = response.result;
      } else {
        result = response;
      }

      if (result === '0x') {
        throw new Error(`Call to ${method} returned empty result`);
      }

      const decodedResult = contract.interface.decodeFunctionResult(method, result);
      return decodedResult.length === 1 ? decodedResult[0] : decodedResult;
    } catch (error) {
      console.log(`Error in ${method}:`, error);
      throw error;
    }
  }, [provider, accounts, signer]);

  const sendTransaction = useCallback(async (contractAddress: string, abi: any[], method: string, args: any[], options = {}) => {
    if (!signer) throw new Error('No signer available');
    const contract = new ethers.Contract(contractAddress, abi, signer);
    console.log('User contract interaction:', method);
    return await contract[method](...args, options);
  }, [signer]);

  const sendAppTransaction = useCallback(async (contractAddress: string, abi: any[], method: string, args: any[], options = {}) => {
    try {
      const response = await fetch('/api/app-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress,
          methodName: method,
          args,
          options,
          abi: abi, // TODO: avoid sending the entire ABI in the request
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to execute transaction');
      }

      const result = await response.json();
      console.log('App transaction succeeded:', result.transactionHash);
      return result;
    } catch (error) {
      console.error('App transaction failed:', error);
      throw error;
    }
  }, []);

  const sendTransactionLowLevel = useCallback(async (
    contractAddress: string,
    abi: any[],
    method: string,
    args: any[],
    options = {}
  ): Promise<ethers.TransactionReceipt> => {
    if (!signer) throw new Error('No signer available');
    if (!directProvider) throw new Error('No direct provider available');
    if (!provider) throw new Error('No UP provider available');
    if (!accounts[0]) throw new Error('No account available');

    const contract = new ethers.Contract(contractAddress, abi, signer);
    console.log('User contract interaction:', method);

    try {
      const data = contract.interface.encodeFunctionData(method, args);

      const txParams = {
        from: accounts[0],
        to: contractAddress,
        data,
        ...options,
      };

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [txParams]
      });

      console.log('Transaction sent via low-level call:', txHash);

      const partialTx = {
        hash: txHash,
        confirmations: 0,
        from: accounts[0],
        to: contractAddress,
        data,
        wait: async () => { throw new Error('Native wait() not supported for Relayer transactions'); }
      } as unknown as ethers.TransactionResponse;

      const enhancedTx = enhanceTransaction(partialTx);

      return await enhancedTx.getReceipt();
    } catch (error) {
      console.error('All transaction submission methods failed:', error);
      throw error;
    }

    function enhanceTransaction(tx: ethers.TransactionResponse): EnhancedTransactionResponse {
      const enhancedTx = tx as EnhancedTransactionResponse;

      enhancedTx.waitForConfirmation = async (confirmations = 1, timeoutSeconds = 180) => {
        console.log(`Waiting for ${confirmations} confirmation(s) for tx: ${tx.hash}`);

        return new Promise<ethers.TransactionReceipt>((resolve, reject) => {
          const startTime = Date.now();

          const checkReceipt = async () => {
            try {
              const receipt = await directProvider?.getTransactionReceipt(tx.hash);

              if (receipt) {
                if (await receipt.confirmations() >= confirmations) {
                  console.log(`Transaction confirmed with ${receipt.confirmations} confirmation(s)`);
                  clearInterval(intervalId);
                  resolve(receipt);
                  return;
                }
                console.log(`Got receipt but only ${receipt.confirmations} confirmation(s) so far`);
              }

              if ((Date.now() - startTime) > timeoutSeconds * 1000) {
                clearInterval(intervalId);
                reject(new Error(`Transaction confirmation timed out after ${timeoutSeconds} seconds`));
              }
            } catch (error) {
              console.error("Error checking transaction receipt:", error);
              // Don't reject here, just log and continue polling
            }
          };

          // Start polling
          const intervalId = setInterval(checkReceipt, 2000); // Check every 2 seconds

          checkReceipt();
        });
      };

      enhancedTx.getReceipt = async (timeoutSeconds = 180) => {
        console.log(`Waiting for receipt for tx: ${tx.hash}`);

        return new Promise<ethers.TransactionReceipt>((resolve, reject) => {
          const startTime = Date.now();

          const checkReceipt = async () => {
            try {
              const receipt = await directProvider?.getTransactionReceipt(tx.hash);

              if (receipt) {
                console.log(`Got transaction receipt for ${tx.hash}`);
                clearInterval(intervalId);
                resolve(receipt);
                return;
              }

              if ((Date.now() - startTime) > timeoutSeconds * 1000) {
                clearInterval(intervalId);
                reject(new Error(`Transaction receipt fetch timed out after ${timeoutSeconds} seconds`));
              }
            } catch (error) {
              console.error("Error checking transaction receipt:", error);
              // Don't reject here, just log and continue polling
            }
          };

          // Start polling
          const intervalId = setInterval(checkReceipt, 2000); // Check every 2 seconds

          checkReceipt();
        });
      };

      return enhancedTx;
    }
  }, [signer, directProvider, provider, accounts]);

  return (
    <ProfileContext.Provider value={{
      chainId,
      accounts,
      contextAccounts,
      walletConnected,
      error,
      provider,
      browserProvider,
      isOwner,
      profileAddress,
      signer,
      callContract,
      sendTransaction,
      sendAppTransaction,
      sendTransactionLowLevel,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
