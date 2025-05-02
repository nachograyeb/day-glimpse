'use client'

import { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useProfileImage } from '@/hooks/useProfileImage';
import { ImageUploader } from './ImageUploader';
import { ClaimNFTButton } from './nft/ClaimNFTButton';
import DayGlimpseLogo from './DayGlimpseLogo';
import styles from './ProfilePage.module.css';

export const ProfilePage = () => {
  const { isOwner, profileAddress, isLoading: profileLoading } = useProfile();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  const {
    image,
    error,
    isLoading: imageLoading,
    isPrivate,
    uploadImage,
    deleteImage,
    initialized: imageInitialized
  } = useProfileImage({
    profileAddress,
    isOwner
  });

  const handleImageLoadChange = (loaded: boolean) => {
    setImageLoaded(loaded);
  };

  // Wait for both profile and image to be ready
  useEffect(() => {
    if (!profileLoading && imageInitialized) {
      setPageReady(true);
    }
  }, [profileLoading, imageInitialized]);

  if (!pageReady) {
    return (
      <div className={styles.container}>
        <DayGlimpseLogo
          size="large"
          animated={true}
          showSubtitle={true}
          fixedPosition={true}
        />

        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <DayGlimpseLogo
        size="large"
        animated={true}
        showSubtitle={true}
        fixedPosition={true}
      />

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

        {/* ClaimNFTButton will handle the mutual followers check internally */}
        {!isOwner && image && profileAddress && (
          <ClaimNFTButton
            imageUrl={image}
            profileAddress={profileAddress}
            imageLoaded={imageLoaded}
          />
        )}
      </div>
    </div>
  );
};
