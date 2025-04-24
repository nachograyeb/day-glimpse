'use client'

import { useProfile } from '@/contexts/ProfileContext';
import { ConnectProfile } from '@/components/ConnectProfile';
import styles from '@/components/ConnectProfile.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { walletConnected } = useProfile();

  return (
    <div className={styles.wrapper}>
      <div className={styles.waitingState}>
        <div className={styles.animatedBackground} />

        {/* Show ConnectProfile when not connected, otherwise show children */}
        {!walletConnected ? <ConnectProfile /> : children}
      </div>
    </div>
  );
};
