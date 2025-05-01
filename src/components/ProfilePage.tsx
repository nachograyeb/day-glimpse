'use client'

import { useState } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useProfileImage } from '@/hooks/useProfileImage';
import { ImageUploader } from './ImageUploader';
import { ClaimNFTButton } from './nft/ClaimNFTButton';
import DayGlimpseLogo from './DayGlimpseLogo';
import styles from './ProfilePage.module.css';

export const ProfilePage = () => {
  const { isOwner, profileAddress } = useProfile();
  const [imageLoaded, setImageLoaded] = useState(false);

  const {
    image,
    error,
    isLoading,
    isPrivate,
    uploadImage,
    deleteImage
  } = useProfileImage({
    profileAddress,
    isOwner
  });

  const handleImageLoadChange = (loaded: boolean) => {
    setImageLoaded(loaded);
  };

  return (
    <div className={styles.container}>
      {/* Logo with fixed position at the top */}
      <DayGlimpseLogo
        size="large"
        animated={true}
        showSubtitle={true}
        fixedPosition={true} // Enable fixed positioning
      />

      <div className={styles.imageContainer}>
        <ImageUploader
          isOwner={isOwner}
          profileAddress={profileAddress}
          image={image}
          error={error}
          isLoading={isLoading}
          isPrivate={isPrivate}
          onUpload={uploadImage}
          onDelete={deleteImage}
          onImageLoad={handleImageLoadChange}
        />

        {!isOwner && image && profileAddress && !isPrivate && (
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
