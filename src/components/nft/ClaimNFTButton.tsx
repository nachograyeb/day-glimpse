'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './ClaimNFTButton.module.css';
import { NFTClaimModal } from './NFTClaimModal';
import { useDayGlimpse } from '@/hooks/useDayGlimpse';
import { useProfile } from '@/contexts/ProfileContext';

interface ClaimNFTButtonProps {
  imageUrl: string | null;
  profileAddress: string | null;
  imageLoaded?: boolean;
}

export const ClaimNFTButton = ({
  imageUrl,
  profileAddress,
  imageLoaded = true
}: ClaimNFTButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMutualFollower, setIsMutualFollower] = useState(false);
  const [checkingFollowStatus, setCheckingFollowStatus] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  const { areMutualFollowers } = useDayGlimpse();
  const { accounts } = useProfile();

  // Use a ref to track the first account address for comparison
  const accountAddressRef = useRef<string | null>(null);
  const currentAccountAddress = accounts && accounts.length > 0 ? accounts[0] : null;

  useEffect(() => {
    // Only proceed if account address or profileAddress has changed
    if (
      (currentAccountAddress === accountAddressRef.current) &&
      profileAddress &&
      accountAddressRef.current
    ) {
      return;
    }

    // Update the ref with current account address
    accountAddressRef.current = currentAccountAddress;

    const checkMutualFollowStatus = async () => {
      if (profileAddress && currentAccountAddress) {
        try {
          setCheckingFollowStatus(true);
          const result = await areMutualFollowers(profileAddress, currentAccountAddress);
          console.log("areMutualFollowers result", result);
          setIsMutualFollower(result);
        } catch (error) {
          console.error("Error checking mutual follow status:", error);
          setIsMutualFollower(false);
        } finally {
          setCheckingFollowStatus(false);
        }
      }
    };

    checkMutualFollowStatus();
  }, [profileAddress, currentAccountAddress, areMutualFollowers]);

  if (!imageUrl || !profileAddress || !imageLoaded) {
    return null;
  }

  const handleButtonClick = () => {
    if (isMutualFollower) {
      setIsModalOpen(true);
    }
  };

  const isButtonDisabled = !isMutualFollower || checkingFollowStatus;

  return (
    <>
      <div className={styles.buttonContainer}>
        <button
          className={`${styles.claimButton} ${isButtonDisabled ? styles.disabled : ''}`}
          onClick={handleButtonClick}
          onMouseEnter={() => {
            setShowTooltip(true);
          }}
          onMouseLeave={() => {
            setShowTooltip(false);
          }}
          aria-label="Claim as NFT"
        >
          <span className={styles.buttonIcon}>
            {checkingFollowStatus ? (
              <div className={styles.miniLoader}></div>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="8" width="16" height="13" rx="1" stroke="white" strokeWidth="2" />
                <path d="M4 5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V8H4V5Z" stroke="white" strokeWidth="2" />
                <path d="M12 15L9 12L12 9L15 12L12 15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </button>

        {showTooltip && (
          <div className={styles.tooltip}>
            {checkingFollowStatus ?
              'Checking follow status...' :
              isButtonDisabled ? 'To claim as NFT, you need to be mutual followers' : 'Claim this Day Glimpse as NFT'}
          </div>
        )}
      </div>

      {isModalOpen && (
        <NFTClaimModal
          imageUrl={imageUrl}
          profileAddress={profileAddress}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};
