'use client'

import { useState, useEffect } from 'react';
import { useDayGlimpse } from './useDayGlimpse';

interface UseProfileImageProps {
  profileAddress: string | null;
  isOwner: boolean;
}

export function useProfileImage({ profileAddress, isOwner }: UseProfileImageProps) {
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);

  const { setDayGlimpse, getDayGlimpse, deleteDayGlimpse, isExpired, markExpired } = useDayGlimpse();

  useEffect(() => {
    if (profileAddress) {
      fetchImage(profileAddress);
    }
  }, [profileAddress]);

  const fetchImage = async (address: string) => {
    try {
      setIsLoading(true);
      const dayGlimpseData = await getDayGlimpse(address);
      console.log('DayGlimpse data:', dayGlimpseData);

      if (!dayGlimpseData?.storageHash) {
        console.log(`No image found for ${address}`);
        setImage(null);

        if (await isExpired(address)) {
          console.log(`Image expired for ${address}`);
          markExpired(address).then(() => console.log('Marked image as expired'));
        }

        return;
      }

      // Set the privacy status based on blockchain data
      setIsPrivate(dayGlimpseData.isPrivate);

      const response = await fetch(`/api/images/get?imageId=${dayGlimpseData.storageHash}`);

      if (response.ok) {
        const url = await response.json();
        setImage(url);
      } else {
        console.log(`No image found on the server for ${address}`);
        setImage(null);
      }
    } catch (error) {
      console.error('Error fetching image from API:', error);
      setImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImage = async (file: File, isPrivateUpload: boolean = false) => {
    if (!isOwner) {
      setError('Only the owner can upload images');
      return;
    }

    if (!profileAddress) {
      setError('No profile address provided');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      setError('');
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
      setImage(data?.url);
      setIsPrivate(isPrivateUpload);

      if (data?.url && data?.id) {
        await setDayGlimpse(data.id, isPrivateUpload);
      }

      return data?.url;
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = async () => {
    if (!isOwner) {
      setError('Only the owner can delete images');
      return;
    }

    if (!profileAddress) {
      setError('No profile address provided');
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      await deleteDayGlimpse();
      const response = await fetch(`/api/images/delete?imageId=${profileAddress}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      setImage(null);
      setIsPrivate(false);
    } catch (err: any) {
      console.error('Error deleting image:', err);
      setError(err.message || 'Failed to delete image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    image,
    error,
    isLoading,
    isPrivate,
    uploadImage,
    deleteImage,
    setError,
  };
}
