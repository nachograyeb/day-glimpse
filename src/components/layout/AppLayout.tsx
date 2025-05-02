'use client'

import { useProfile } from '@/contexts/ProfileContext';
import { ConnectProfile } from '@/components/ConnectProfile';
import styles from '@/components/ConnectProfile.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { walletConnected, isLoading } = useProfile();

  // Show loading indicator while checking wallet connection
  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.waitingState}>
          <div className={styles.animatedBackground} />
          {/* <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Connecting to your Universal Profile...</p>
          </div> */}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.waitingState}>
        <div className={styles.animatedBackground} />

        {/* Only show ConnectProfile when definitely not connected */}
        {!walletConnected ? <ConnectProfile /> : children}
      </div>
    </div>
  );
};
