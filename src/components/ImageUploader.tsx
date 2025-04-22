// src/components/ImageUploader.tsx
'use client'

import { useState, useRef, useEffect } from 'react';
import styles from './ImageUploader.module.css';

interface ImageUploaderProps {
  isOwner: boolean;
  profileAddress: string | null;
}

export const ImageUploader = ({ isOwner, profileAddress }: ImageUploaderProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load image from storage when component mounts or profileAddress changes
  useEffect(() => {
    if (profileAddress) {
      const storedImage = localStorage.getItem(`profile-image-${profileAddress.toLowerCase()}`);
      if (storedImage) {
        setImage(storedImage);
      } else {
        setImage(null);
      }
    }
  }, [profileAddress]);

  const handleUploadClick = () => {
    if (!isOwner) {
      setError('Only the owner can upload images');
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = event.target.files?.[0];

    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    if (profileAddress) {
      // Create form data
      const formData = new FormData();
      formData.append('image', file);
      formData.append('profileAddress', profileAddress);

      // Upload to our backend API
      const response = await fetch('/api/images/create', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();

      // Store URL in localStorage for quicker access next time
      localStorage.setItem(profileAddress.toLowerCase(), data?.url);
      setImage(data?.url);
    }
  };

  const handleDelete = () => {
    if (!isOwner) {
      setError('Only the owner can delete images');
      return;
    }

    if (profileAddress) {
      localStorage.removeItem(`profile-image-${profileAddress.toLowerCase()}`);
      setImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={styles.container}>
      {image ? (
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
