'use client'

import { useRef, useState, useEffect } from 'react';
import styles from './ImageUploader.module.css';

const PrivacyModal = ({
  isOpen,
  onClose,
  onSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (isPrivate: boolean) => void;
}) => {
  if (!isOpen) return null;

  const handlePublicSelect = () => {
    onSelect(false);
    onClose();
  };

  const handleExclusiveSelect = () => {
    onSelect(true);
    onClose();
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Choose Visibility</h3>

        <div className={styles.optionsContainer}>
          <div className={styles.optionCard} onClick={handlePublicSelect}>
            <div className={styles.optionIcon}>🌐</div>
            <h4 className={styles.optionTitle}>Public</h4>
            <p className={styles.optionDescription}>Anyone can view your DayGlimpse</p>
          </div>

          <div className={styles.optionCard} onClick={handleExclusiveSelect}>
            <div className={styles.optionIcon}>🔒</div>
            <h4 className={styles.optionTitle}>Exclusive</h4>
            <p className={styles.optionDescription}>Only users that hold at least one of your previous DayGlimpse NFTs can view it</p>
          </div>
        </div>

        <button className={styles.modalCloseButton} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrivacy, setSelectedPrivacy] = useState(false);

  useEffect(() => {
    if (onImageLoad) {
      onImageLoad(imageLoaded);
    }
  }, [imageLoaded, onImageLoad]);

  const handleUploadClick = () => {
    if (!isOwner) return;
    // Open modal instead of file picker directly
    setIsModalOpen(true);
  };

  const handlePrivacySelect = (isPrivate: boolean) => {
    setSelectedPrivacy(isPrivate);
    // Open file picker after selecting privacy
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImageLoaded(false);
      await onUpload(file, selectedPrivacy);

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
          {/* <p>Processing image...</p> */}
        </div>
      ) : image ? (
        <div className={styles.imageViewer}>
          <img
            src={image}
            alt="Profile content"
            className={styles.image}
            onLoad={handleImageLoad}
          />
          {imageLoaded && isPrivate && (
            <div className={styles.privacyTag}>
              <span className={styles.privacyIcon}>🔒</span>
            </div>
          )}
          {isOwner && imageLoaded && (
            <button
              onClick={handleDeleteClick}
              className={styles.deleteButton}
              aria-label="Delete image"
            >
              <span className={styles.deleteIcon}>🗑️</span>
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
            <div className={styles.uploadIcon}></div>
            <div className={styles.uploadText}>
              {isOwner
                ? 'Share a new Day Glimpse'
                : 'No Day Glimpse shared yet'}
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

          {/* Privacy selection modal */}
          <PrivacyModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSelect={handlePrivacySelect}
          />
        </>
      )}
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};
