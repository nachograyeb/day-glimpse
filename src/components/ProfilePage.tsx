'use client'

import { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useProfileImage } from '@/hooks/useProfileImage';
import { ImageUploader } from './ImageUploader';
import { ClaimNFTButton } from './nft/ClaimNFTButton';
import DayGlimpseLogo from './DayGlimpseLogo';
import styles from './ProfilePage.module.css';

export const ProfilePage = () => {
  const {
    isOwner,
    profileAddress,
    isLoading: profileLoading,
    walletConnected,
    signer,
    reconnect
  } = useProfile();

  const [imageLoaded, setImageLoaded] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [attemptedReconnect, setAttemptedReconnect] = useState(false);

  const {
    image,
    error,
    isLoading: imageLoading,
    isPrivate,
    initialized,
    uploadImage,
    deleteImage,
    setError
  } = useProfileImage({
    profileAddress,
    isOwner
  });

  // Effect to handle reconnection if wallet is connected but signer is missing
  useEffect(() => {
    const handleReconnection = async () => {
      if (walletConnected && !signer && !attemptedReconnect) {
        setAttemptedReconnect(true);
        try {
          await reconnect();
        } catch (error) {
          console.error('Failed to reconnect:', error);
        }
      }
    };

    handleReconnection();
  }, [walletConnected, signer, attemptedReconnect, reconnect]);

  const handleImageLoadChange = (loaded: boolean) => {
    setImageLoaded(loaded);
  };

  // Wait for both profile and image to be ready
  useEffect(() => {
    if (!profileLoading && initialized) {
      setPageReady(true);
    }
  }, [profileLoading, initialized]);

  if (!pageReady) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingScreen}>
          <div className={styles.logoContainer}>
            <DayGlimpseLogo
              size="large"
              animated={true}
              showSubtitle={true}
              fixedPosition={true}
            />
          </div>
          <div className={styles.loadingSpinner}></div>
          {/* <p>Loading Day Glimpse...</p> */}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Logo overlay when image is shown */}
      {image && imageLoaded && (
        <div className={styles.logoOverlay}>
          <DayGlimpseLogo
            size="small"
            animated={false}
            showSubtitle={false}
            fixedPosition={false}
          />
        </div>
      )}

      {/* Show large logo only when no image is displayed */}
      {(!image || !imageLoaded) && (
        <div className={styles.logoHeader}>
          <DayGlimpseLogo
            size="large"
            animated={true}
            showSubtitle={true}
            fixedPosition={false}
          />
        </div>
      )}

      <div className={styles.imageContainer}>
        <ImageUploader
          isOwner={isOwner}
          profileAddress={profileAddress}
          image={image}
          error={error}
          isLoading={imageLoading}
          isPrivate={isPrivate}
          onUpload={uploadImage}
          onDelete={deleteImage}
          onImageLoad={handleImageLoadChange}
        />

        {/* ClaimNFTButton positioned in the corner */}
        {!isOwner && image && profileAddress && (
          <div className={styles.claimButtonWrapper}>
            <ClaimNFTButton
              imageUrl={image}
              profileAddress={profileAddress}
              imageLoaded={imageLoaded}
            />
          </div>
        )}
      </div>
    </div>
  );
};
