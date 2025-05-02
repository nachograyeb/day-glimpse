'use client'

import { useEffect, useState } from 'react';
import styles from './NFTClaimModal.module.css';
import { useDayGlimpse } from '@/hooks/useDayGlimpse';

type NFTClaimStage = 'initial' | 'minting' | 'success' | 'error';

interface NFTClaimModalProps {
  imageUrl: string;
  profileAddress: string;
  onClose: () => void;
}

export const NFTClaimModal = ({ imageUrl, profileAddress, onClose }: NFTClaimModalProps) => {
  const [stage, setStage] = useState<NFTClaimStage>('initial');
  const [error, setError] = useState<string | null>(null);
  const { mintNFT } = useDayGlimpse();

  const handleStartMinting = async () => {
    console.log("handleStartMinting called");
    setStage('minting');

    try {
      await mintNFT(profileAddress);
      setStage('success');
    } catch (err) {
      console.log("Minting error:", err);
      setError('Minting failed: ' + (err as Error).message);
      setStage('error');
      return;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>×</button>

        {stage === 'initial' && (
          <div className={styles.initialStage}>
            <h2 className={styles.modalTitle}>Claim this image as an NFT</h2>
            <div className={styles.imagePreview}>
              <img src={imageUrl} alt="Profile" />
            </div>
            <p className={styles.description}>
              This will create a unique NFT based on this Day Glimpse.
              The NFT will be minted on the same chain as the Universal Profile.
            </p>
            <button
              className={styles.mintButton}
              onClick={handleStartMinting}
            >
              Start Minting
            </button>
          </div>
        )}

        {stage === 'minting' && (
          <div className={styles.mintingStage}>
            <h2 className={styles.modalTitle}>Minting your NFT...</h2>
            <div className={styles.loaderContainer}>
              <div className={styles.loader}></div>
            </div>
            <p className={styles.mintingDescription}>
              Your NFT will be ready in just a few moments...
            </p>
          </div>
        )}

        {stage === 'success' && (
          <div className={styles.successStage}>
            <h2 className={styles.modalTitle}>NFT Minted Successfully!</h2>
            <div className={styles.nftContainer}>
              <div className={styles.nftFrame}>
                <img src={imageUrl} alt="Go to Collections and see your NFT" />
              </div>
              <div className={styles.confetti}></div>
            </div>
            <div className={styles.nftDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Collection:</span>
                <span className={styles.detailValue}>DAY GLIMPSES</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Owner:</span>
                <span className={styles.detailValue}>{profileAddress.substring(0, 8)}...{profileAddress.substring(profileAddress.length - 6)}</span>
              </div>
            </div>
            <button
              className={styles.closeSuccessButton}
              onClick={onClose}
            >
              Return to Profile
            </button>
          </div>
        )}

        {stage === 'error' && (
          <div className={styles.errorStage}>
            <h2 className={styles.modalTitle}>Minting Failed</h2>
            <div className={styles.errorIcon}>❌</div>
            <p className={styles.errorMessage}>{error}</p>
            <p className={styles.errorDescription}>
              There was an error while minting your NFT.
              Please try again later or contact support if the issue persists.
            </p>
            <div className={styles.errorButtons}>
              <button
                className={styles.tryAgainButton}
                onClick={handleStartMinting}
              >
                Try Again
              </button>
              <button
                className={styles.closeErrorButton}
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
