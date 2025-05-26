'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { createClientUPProvider } from '@lukso/up-provider';
import { type Eip1193Provider, ethers } from 'ethers';

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
  isLoading: boolean;
  callContract: (contractAddress: string, abi: any[], method: string, args: any[]) => Promise<any>;
  sendTransaction: (contractAddress: string, abi: any[], method: string, args: any[], options?: any) => Promise<ethers.TransactionResponse>;
  sendAppTransaction: (contractAddress: string, abi: any[], method: string, args: any[], options?: any) => Promise<any>;
  sendTransactionLowLevel: (contractAddress: string, abi: any[], method: string, args: any[], options?: any) => Promise<ethers.TransactionReceipt>;
  reconnect: () => Promise<void>; // New function to handle reconnection
}

interface EnhancedTransactionResponse extends ethers.TransactionResponse {
  waitForConfirmation: (confirmations?: number, timeoutSeconds?: number) => Promise<ethers.TransactionReceipt>;
  getReceipt: (timeoutSeconds?: number) => Promise<ethers.TransactionReceipt>;
  isPending: () => Promise<boolean>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [chainId, setChainId] = useState<number>(0);
  const [accounts, setAccounts] = useState<Array<`0x${string}`>>([]);
  const [contextAccounts, setContextAccounts] = useState<Array<`0x${string}`>>([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState<any>(null);
  const [browserProvider, setBrowserProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [profileAddress, setProfileAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [directProvider, setDirectProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use refs to store the latest values without triggering re-renders
  const accountsRef = useRef<Array<`0x${string}`>>(accounts);
  const contextAccountsRef = useRef<Array<`0x${string}`>>(contextAccounts);
  const chainIdRef = useRef<number>(chainId);
  const providerRef = useRef<any>(provider);
  const browserProviderRef = useRef<ethers.BrowserProvider | null>(browserProvider);

  // Update refs when values change
  useEffect(() => { accountsRef.current = accounts; }, [accounts]);
  useEffect(() => { contextAccountsRef.current = contextAccounts; }, [contextAccounts]);
  useEffect(() => { chainIdRef.current = chainId; }, [chainId]);
  useEffect(() => { providerRef.current = provider; }, [provider]);
  useEffect(() => { browserProviderRef.current = browserProvider; }, [browserProvider]);

  // Create a function to initialize providers
  const initializeProviders = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      const _provider = createClientUPProvider();
      const _browserProvider = new ethers.BrowserProvider(_provider as unknown as Eip1193Provider);
      setProvider(_provider);
      setBrowserProvider(_browserProvider);

      const _directProvider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_LUKSO_RPC_URL || 'https://rpc.testnet.lukso.network');
      setDirectProvider(_directProvider);

      const parentProfileAddress = localStorage.getItem('parentProfileAddress');
      if (parentProfileAddress) {
        console.log('Found stored parent profile address:', parentProfileAddress);
      }

      return { provider: _provider, browserProvider: _browserProvider };
    } catch (err) {
      console.error('Failed to create provider:', err);
      setIsLoading(false);
      return null;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeProviders();
  }, [initializeProviders]);

  const updateConnected = useCallback(async (accs: Array<`0x${string}`>, ctxAccs: Array<`0x${string}`>, chId: number, currentBrowserProvider: ethers.BrowserProvider | null) => {
    const isConnected = accs.length > 0 && ctxAccs.length > 0;

    try {
      // Only update signer if we have connections and a browser provider
      if (isConnected && currentBrowserProvider) {
        try {
          const _signer = await currentBrowserProvider.getSigner();
          setSigner(_signer);

          // Verify signer is working with a simple call
          await _signer.provider.getNetwork();

          setWalletConnected(true);

          if (ctxAccs.length > 0) {
            setProfileAddress(ctxAccs[0]);
          }

          if (accs.length > 0 && ctxAccs.length > 0) {
            const ownerStatus = accs[0].toLowerCase() === ctxAccs[0].toLowerCase();
            setIsOwner(ownerStatus);
          } else {
            setIsOwner(false);
          }
        } catch (signerError) {
          console.error('Signer not ready or available:', signerError);
          setWalletConnected(false);
        }
      } else {
        setWalletConnected(false);
        setIsOwner(false);
      }
    } catch (error) {
      console.error('Error in updateConnected:', error);
      setWalletConnected(false);
    } finally {
      // Always set loading to false after attempt to connect
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!browserProvider || !provider) return;

    async function init() {
      if (!browserProvider || !provider) return;
      try {
        const network = await browserProvider.getNetwork();
        const _chainId = Number(network.chainId);
        setChainId(_chainId);

        const _signer = await browserProvider.getSigner();
        setSigner(_signer);

        const _accounts = [await _signer.getAddress()] as Array<`0x${string}`>;
        setAccounts(_accounts);

        const _contextAccounts = provider.contextAccounts;
        setContextAccounts(_contextAccounts);

        await updateConnected(_accounts, _contextAccounts, _chainId, browserProvider);
      } catch (error) {
        console.log('Error in init:', error);
        setIsLoading(false);
      }
    }

    init();
  }, [browserProvider, provider, updateConnected]);

  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = async (_accounts: Array<`0x${string}`>) => {
      if (JSON.stringify(_accounts) !== JSON.stringify(accountsRef.current)) {
        setAccounts(_accounts);
        await updateConnected(_accounts, contextAccountsRef.current, chainIdRef.current, browserProviderRef.current);
      }
    };

    const handleContextAccountsChanged = async (_accounts: Array<`0x${string}`>) => {
      if (JSON.stringify(_accounts) !== JSON.stringify(contextAccountsRef.current)) {
        setContextAccounts(_accounts);
        await updateConnected(accountsRef.current, _accounts, chainIdRef.current, browserProviderRef.current);
      }
    };

    const handleChainChanged = async (_chainId: string | number) => {
      const chainIdNumber = typeof _chainId === 'string' ? parseInt(_chainId, 16) : _chainId;
      if (chainIdNumber !== chainIdRef.current) {
        setChainId(chainIdNumber);
        await updateConnected(accountsRef.current, contextAccountsRef.current, chainIdNumber, browserProviderRef.current);
      }
    };

    // Set up event listeners
    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    if (provider && provider.on) {
      provider.on('contextAccountsChanged', handleContextAccountsChanged);
    }

    return () => {
      provider.off('accountsChanged', handleAccountsChanged);
      provider.off('chainChanged', handleChainChanged);
      if (provider && provider.off) {
        provider.off('contextAccountsChanged', handleContextAccountsChanged);
      }
    };
  }, [provider, updateConnected]);

  // Add a function to handle reconnection
  const reconnect = useCallback(async () => {
    setIsLoading(true);

    try {
      const providers = await initializeProviders();

      if (!providers) {
        throw new Error('Failed to initialize providers');
      }

      const { provider: newProvider, browserProvider: newBrowserProvider } = providers;

      const network = await newBrowserProvider.getNetwork();
      const _chainId = Number(network.chainId);
      setChainId(_chainId);

      try {
        const _signer = await newBrowserProvider.getSigner();
        setSigner(_signer);

        const _accounts = [await _signer.getAddress()] as Array<`0x${string}`>;
        setAccounts(_accounts);

        const _contextAccounts = newProvider.contextAccounts;
        setContextAccounts(_contextAccounts);

        await updateConnected(_accounts, _contextAccounts, _chainId, newBrowserProvider);
      } catch (error) {
        console.error('Error getting signer during reconnect:', error);
        throw error;
      }
    } catch (error) {
      console.error('Reconnection failed:', error);
      setIsLoading(false);
      setWalletConnected(false);
    }
  }, [initializeProviders, updateConnected]);

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
    if (!signer) {
      // If signer is not available, try to reconnect
      await reconnect();
      if (!signer) throw new Error('No signer available');
    }

    const contract = new ethers.Contract(contractAddress, abi, signer);
    console.log('User contract interaction:', method);
    return await contract[method](...args, options);
  }, [signer, reconnect]);

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
          abi: abi,
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
    if (!signer) {
      // If signer is not available, try to reconnect
      await reconnect();
      if (!signer) throw new Error('No signer available');
    }

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

      enhancedTx.isPending = async () => {
        try {
          const receipt = await directProvider?.getTransactionReceipt(tx.hash);
          return receipt === null;
        } catch (error) {
          console.error("Error checking if transaction is pending:", error);
          return true; // Assume it's still pending if there's an error
        }
      };

      return enhancedTx;
    }
  }, [signer, directProvider, provider, accounts, reconnect]);

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
      isLoading,
      callContract,
      sendTransaction,
      sendAppTransaction,
      sendTransactionLowLevel,
      reconnect,
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
