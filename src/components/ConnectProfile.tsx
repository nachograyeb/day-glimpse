// src/components/ConnectProfile.tsx
'use client'

import { useState, useEffect, useCallback } from 'react';
import { createClientUPProvider } from '@lukso/up-provider'
import { type Eip1193Provider, ethers } from 'ethers'
import styles from './ConnectProfile.module.css'

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const _provider = createClientUPProvider()
        const _browserProvider = new ethers.BrowserProvider(_provider as unknown as Eip1193Provider)
        setProvider(_provider)
        setBrowserProvider(_browserProvider)
      } catch (err) {
        console.error('Failed to create provider:', err)
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

  return (
    <div className={styles.wrapper}>
      {walletConnected ? (
        <div className={styles.connectedState}>
          <h2>Wallet Connected</h2>
          <p>Chain ID: {chainId}</p>
          <p>Account: {accounts[0]}</p>
          {contextAccounts.length > 0 && (
            <p>Context Account: {contextAccounts[0]}</p>
          )}
        </div>
      ) : (
        <div className={styles.waitingState}>
          <div className={styles.animatedBackground} />
          <div className={styles.content}>
            <h1>
              <span className={styles.gradientText}>Connect your Universal Profile</span>
              <br />
              <span className={styles.gradientTextReverse}>and see what's inside</span>
            </h1>
            <div className={styles.divider}></div>
          </div>
        </div>
      )}
    </div>
  );
};
