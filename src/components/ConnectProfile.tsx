'use client'

import styles from './ConnectProfile.module.css';

export const ConnectProfile = () => {
  return (
    <div className={styles.content}>
      <h1>
        <span className={styles.gradientText}>Connect your Universal Profile</span>
        <br />
        <span className={styles.gradientTextReverse}>and see what's inside</span>
      </h1>
      <div className={styles.divider}></div>
    </div>
  );
};
