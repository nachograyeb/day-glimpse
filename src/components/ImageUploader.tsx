'use client'

import { useRef, useState, useEffect } from 'react';
import styles from './ImageUploader.module.css';

interface ImageUploaderProps {
  isOwner: boolean;
  profileAddress: string | null;
  image: string | null;
  error: string;
  isLoading: boolean;
  isPrivate?: boolean;
  onUpload: (file: File, isPrivate: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
  onImageLoad?: (loaded: boolean) => void;
}

export const ImageUploader = ({
  isOwner,
  image,
  error,
  isLoading,
  isPrivate = false,
  onUpload,
  onDelete,
  onImageLoad
}: ImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [privacyToggle, setPrivacyToggle] = useState(isPrivate);

  useEffect(() => {
    setPrivacyToggle(isPrivate);
  }, [isPrivate]);

  useEffect(() => {
    if (onImageLoad) {
      onImageLoad(imageLoaded);
    }
  }, [imageLoaded, onImageLoad]);

  const handleUploadClick = () => {
    if (!isOwner) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImageLoaded(false);
      await onUpload(file, privacyToggle);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.log('File upload failed');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageLoaded(false);
    onDelete();
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handlePrivacyToggle = () => {
    setPrivacyToggle(!privacyToggle);
  };

  useEffect(() => {
    if (!image) {
      setImageLoaded(false);
    }
  }, [image]);

  return (
    <div className={styles.container}>
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Processing image...</p>
        </div>
      ) : image ? (
        <div className={styles.imageViewer}>
          <img
            src={image}
            alt="Profile content"
            className={styles.image}
            onLoad={handleImageLoad}
          />
          {isOwner && imageLoaded && (
            <button
              onClick={handleDeleteClick}
              className={styles.deleteButton}
              aria-label="Delete image"
            >
              <span className={styles.deleteIcon}>🗑️</span> Delete Image
            </button>
          )}
          {imageLoaded && isPrivate && (
            <div className={styles.privacyTag}>
              <span className={styles.privacyIcon}>🔒</span> Private
            </div>
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
            {isOwner && (
              <div className={styles.privacyToggleContainer}>
                <label className={styles.privacyToggle}>
                  <input
                    type="checkbox"
                    checked={privacyToggle}
                    onChange={handlePrivacyToggle}
                    className={styles.privacyCheckbox}
                  />
                  <span>{privacyToggle ? '🔒 Private' : '🌐 Public'}</span>
                </label>
              </div>
            )}
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
