'use client'

import { useProfile } from '@/contexts/ProfileContext';
import { ImageUploader } from './ImageUploader';

export const ProfilePage = () => {
  const { isOwner, profileAddress } = useProfile();

  return <ImageUploader isOwner={isOwner} profileAddress={profileAddress} />;
};
