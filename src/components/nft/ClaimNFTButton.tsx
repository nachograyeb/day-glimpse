'use client'

import { useState } from 'react';
import styles from './ClaimNFTButton.module.css';
import { NFTClaimModal } from './NFTClaimModal';

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

  if (!imageUrl || !profileAddress || !imageLoaded) {
    return null;
  }

  return (
    <>
      <button
        className={styles.claimButton}
        onClick={() => setIsModalOpen(true)}
      >
        <span className={styles.buttonIcon}>🖼️</span>
        Claim as NFT
      </button>

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
