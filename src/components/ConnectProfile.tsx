'use client'

import styles from './ConnectProfile.module.css';
import DayGlimpseLogo from './DayGlimpseLogo';

export const ConnectProfile = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoWrapper}>
          <DayGlimpseLogo
            size="large"
            animated={true}
            showSubtitle={true}
            fixedPosition={false}
          />
        </div>

        <div className={styles.connectMessage}>
          <span className={styles.connectText}>Connect your Universal Profile</span>
          <div className={styles.connectIconContainer}>
            <div className={styles.connectIcon}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>
          <span className={styles.hintText}>to view and share moments</span>
        </div>
      </div>
    </div>
  );
};
