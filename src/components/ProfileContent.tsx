'use client'

import { useProfile } from '@/contexts/ProfileContext';
import { useProfileImage } from '@/hooks/useProfileImage';
import { ImageUploader } from './ImageUploader';
import { ClaimNFTButton } from './nft/ClaimNFTButton';
import styles from './ProfileContent.module.css';

export const ProfileContent = () => {
  const { isOwner, profileAddress } = useProfile();

  // Use the hook to get image-related state and functions
  const {
    image,
    error,
    isLoading,
    uploadImage,
    deleteImage
  } = useProfileImage({
    profileAddress,
    isOwner
  });

  return (
    <div className={styles.container}>
      <div className={styles.imageContainer}>
        {/* Pass the image data and functions to ImageUploader */}
        <ImageUploader
          isOwner={isOwner}
          profileAddress={profileAddress}
          image={image}
          error={error}
          isLoading={isLoading}
          onUpload={uploadImage}
          onDelete={deleteImage}
        />

        {/* NFT claim button only appears for non-owners when an image exists */}
        {!isOwner && image && profileAddress && (
          <ClaimNFTButton
            imageUrl={image}
            profileAddress={profileAddress}
          />
        )}
      </div>
    </div>
  );
};
