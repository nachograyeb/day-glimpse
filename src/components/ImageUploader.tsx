'use client'

import { useRef } from 'react';
import { useProfileImage } from '@/hooks/useProfileImage';
import styles from './ImageUploader.module.css';

interface ImageUploaderProps {
  isOwner: boolean;
  profileAddress: string | null;
}

export const ImageUploader = ({ isOwner, profileAddress }: ImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    image,
    error,
    isLoading,
    uploadImage,
    deleteImage,
    setError
  } = useProfileImage({ profileAddress, isOwner });

  const handleUploadClick = () => {
    if (!isOwner) {
      setError('Only the owner can upload images');
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadImage(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.log('File upload failed');
    }
  };

  const handleDelete = async () => {
    try {
      const success = await deleteImage();
      if (success && fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.log('Delete failed');
    }
  };

  return (
    <div className={styles.container}>
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Processing image...</p>
        </div>
      ) : image ? (
        <div className={styles.imageViewer}>
          <img src={image} alt="Profile content" className={styles.image} />
          {isOwner && (
            <button onClick={handleDelete} className={styles.deleteButton}>
              <span className={styles.deleteIcon}>🗑️</span> Delete Image
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            className={styles.uploadArea}
            onClick={handleUploadClick}
            style={{ cursor: isOwner ? 'pointer' : 'default' }}
          >
            <div className={styles.uploadIcon}>📤</div>
            <div className={styles.uploadText}>
              {isOwner
                ? 'Click to upload an image'
                : 'No image has been uploaded by the profile owner'}
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className={styles.hidden}
            disabled={!isOwner}
          />
        </>
      )}
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};
