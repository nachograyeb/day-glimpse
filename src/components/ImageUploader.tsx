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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create a consistent key for localStorage
  const getStorageKey = (address: string) => `profile-image-${address.toLowerCase()}`;

  // Load image from storage when component mounts or profileAddress changes
  useEffect(() => {
    if (profileAddress) {
      const storageKey = getStorageKey(profileAddress);
      const storedImage = localStorage.getItem(storageKey);

      if (storedImage) {
        console.log(`Found image for ${profileAddress} in localStorage`);
        setImage(storedImage);
      } else {
        console.log(`No image found for ${profileAddress} in localStorage. Getting image from repository...`);

        const fetchImageFromAPI = async () => {
          try {
            setIsLoading(true);
            const response = await fetch(`/api/images/get?imageId=${profileAddress}`);

            if (response.ok) {
              const url = await response.json();
              if (url) {
                localStorage.setItem(storageKey, url);
                setImage(url);
                console.log(`Fetched and stored image URL from API for ${profileAddress}`);
              }
            } else {
              console.log(`No image found on the server for ${profileAddress}`);
            }
          } catch (error) {
            console.error('Error fetching image from API:', error);
          } finally {
            setIsLoading(false);
          }
        };

        fetchImageFromAPI();
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

    if (!file || !profileAddress) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('data', `{"profileAddress": "${profileAddress}"}`);

      const response = await fetch('/api/images/create', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      // Store with consistent key format
      const storageKey = getStorageKey(profileAddress);
      localStorage.setItem(storageKey, data?.url);
      console.log(`Stored image URL for ${profileAddress} in localStorage`);

      setImage(data?.url);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) {
      setError('Only the owner can delete images');
      return;
    }

    if (profileAddress) {
      try {
        const storageKey = getStorageKey(profileAddress);
        localStorage.removeItem(storageKey);
        console.log(`Removed image for ${profileAddress} from localStorage`);

        const response = await fetch(`/api/images/delete?imageId=${profileAddress}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Delete failed');
        }

        setImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err: any) {
        console.error('Error deleting image:', err);
        setError(err.message || 'Failed to delete image. Please try again.');
      }
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
