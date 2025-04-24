'use client'

import { useProfile } from '@/contexts/ProfileContext';
import styles from './ConnectProfile.module.css';
import { ImageUploader } from './ImageUploader';

export const ConnectProfile = () => {
  const {
    walletConnected,
    isOwner,
    profileAddress
  } = useProfile();

  return (
    <div className={styles.wrapper}>
      {walletConnected ? (
        <div className={styles.waitingState}>
          <div className={styles.animatedBackground} />
          <ImageUploader isOwner={isOwner} profileAddress={profileAddress} />
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
