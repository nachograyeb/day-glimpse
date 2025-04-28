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
    // console.log('Accounts:', accounts, 'Context:', contextAccounts, 'Chain ID:', chainId)
    setWalletConnected(accounts.length > 0 && contextAccounts.length > 0)

    if (contextAccounts.length > 0) {
      setProfileAddress(contextAccounts[0]);
    }

    if (accounts.length > 0 && contextAccounts.length > 0) {
      const isOwner = accounts[0].toLowerCase() === contextAccounts[0].toLowerCase();
      setIsOwner(isOwner);
      // console.log('Is owner?', isOwner);
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
    if (!provider || !profileAddress) throw new Error('No provider or profile address available');

    try {
      // Create a direct provider for encoding
      const directProvider = new ethers.JsonRpcProvider('https://rpc.testnet.lukso.network');
      const contract = new ethers.Contract(contractAddress, abi, directProvider);

      // Encode the function call
      const data = contract.interface.encodeFunctionData(method, args);

      // Make the call through the UP provider with explicit from address
      const response = await provider.request({
        method: 'eth_call',
        params: [
          {
            to: contractAddress,
            data,
            from: profileAddress
          },
          'latest'
        ]
      });

      // Handle the case where we get a full JSON-RPC response object
      let result;
      if (typeof response === 'object' && response !== null && 'result' in response) {
        result = response.result;
      } else {
        result = response;
      }

      // Check for empty result
      if (result === '0x') {
        throw new Error(`Call to ${method} returned empty result`);
      }

      // Decode the result
      const decodedResult = contract.interface.decodeFunctionResult(method, result);
      return decodedResult.length === 1 ? decodedResult[0] : decodedResult;
    } catch (error) {
      console.log(`Error in ${method}:`, error);
      throw error;
    }
  }, [provider, profileAddress]);

  const sendTransaction = useCallback(async (contractAddress: string, abi: any[], method: string, args: any[], options = {}) => {
    if (!signer) throw new Error('No signer available');
    const contract = new ethers.Contract(contractAddress, abi, signer);
    console.log('contract', contract);
    return await contract[method](...args, options);
  }, [signer]);

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
