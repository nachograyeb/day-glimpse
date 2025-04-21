// src/components/ConnectProfile.tsx
'use client'

import { useState, useEffect, useCallback } from 'react';
import { createClientUPProvider } from '@lukso/up-provider'
import { type Eip1193Provider, ethers } from 'ethers'

export const ConnectProfile = () => {
  const [chainId, setChainId] = useState<number>(0)
  const [accounts, setAccounts] = useState<Array<`0x${string}`>>([])
  const [contextAccounts, setContextAccounts] = useState<Array<`0x${string}`>>([])
  const [walletConnected, setWalletConnected] = useState(false)
  const [error, setError] = useState('')
  const [provider, setProvider] = useState<any>(null)
  const [browserProvider, setBrowserProvider] = useState<ethers.BrowserProvider | null>(null)

  const updateConnected = useCallback((accounts: Array<`0x${string}`>, contextAccounts: Array<`0x${string}`>, chainId: number) => {
    console.log(accounts, chainId)
    setWalletConnected(accounts.length > 0 && contextAccounts.length > 0)
  }, [])

  // Initialize providers only on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const _provider = createClientUPProvider()
        const _browserProvider = new ethers.BrowserProvider(_provider as unknown as Eip1193Provider)
        setProvider(_provider)
        setBrowserProvider(_browserProvider)
      } catch (err) {
        console.error('Failed to create provider:', err)
        // Don't set error here to avoid showing the error message in the UI
      }
    }
  }, [])

  // Monitor accountsChanged and chainChained events
  // This is how a grid widget gets its accounts and chainId.
  // Don't call eth_requestAccounts() directly to connect,
  // The connection will be injected by the grid parent page.
  useEffect(() => {
    if (!browserProvider || !provider) return;

    async function init() {
      if (!browserProvider || !provider) return;
      try {
        const network = await browserProvider.getNetwork()
        const _chainId = Number(network.chainId)
        setChainId(_chainId)

        const signer = await browserProvider.getSigner()
        const _accounts = [await signer.getAddress()] as Array<`0x${string}`>
        setAccounts(_accounts)

        const _contextAccounts = provider.contextAccounts
        updateConnected(_accounts, _contextAccounts, _chainId)
      } catch (error) {
        console.log(error);
        // Don't set error here to avoid showing the error message in the UI
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

    // Only add event listeners if browserProvider exists
    provider.on('accountsChanged', accountsChanged)
    provider.on('chainChanged', chainChanged)
    // Check if provider has contextAccountsChanged event
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

  // Add JSX return statement
  return (
    <div className="connect-profile w-full h-full">
      {walletConnected ? (
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Wallet Connected</h2>
          <p className="text-sm">Chain ID: {chainId}</p>
          <p className="text-sm">Account: {accounts[0]}</p>
          {contextAccounts.length > 0 && (
            <p className="text-sm">Context Account: {contextAccounts[0]}</p>
          )}
        </div>
      ) : (
        <div className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-purple-900 via-fuchsia-900 to-pink-900 rounded-2xl overflow-hidden flex items-center justify-center">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.7s' }}></div>
            <div className="absolute w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-fuchsia-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.3s' }}></div>
          </div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

          {/* Content */}
          <div className="relative z-10 text-center p-8">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-fuchsia-400">
                Connect your Universal Profile
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-pink-400 to-purple-400">
                and see what's inside
              </span>
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-fuchsia-400 mx-auto mt-6 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
    </div>
  );
};
