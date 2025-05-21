'use client'

import { useProfile } from '@/contexts/ProfileContext';
import { ConnectProfile } from '@/components/ConnectProfile';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { walletConnected, isLoading } = useProfile();

  // Show loading indicator while checking wallet connection
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingScreen}>
          <div className={styles.loadingSpinner}></div>
          <p>Connecting to your Universal Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Only show ConnectProfile when definitely not connected */}
      {!walletConnected ? <ConnectProfile /> : children}
    </div>
  );
};
