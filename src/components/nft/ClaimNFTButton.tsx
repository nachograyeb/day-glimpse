'use client'

import { useState } from 'react';
import styles from './ClaimNFTButton.module.css';
import { NFTClaimModal } from './NFTClaimModal';

interface ClaimNFTButtonProps {
  imageUrl: string | null;
  profileAddress: string | null;
}

export const ClaimNFTButton = ({ imageUrl, profileAddress }: ClaimNFTButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Only show the button if there's an image to claim
  if (!imageUrl || !profileAddress) {
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
