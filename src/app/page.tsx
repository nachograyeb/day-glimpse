'use client'

import { useEffect } from 'react';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProfilePage } from '@/components/ProfilePage';

export default function Home() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const allowedOrigins = ['https://universaleverything.io', 'http://localhost:3000'];
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }

      if (event.data.type === 'PARENT_PROFILE_ADDRESS') {
        localStorage.setItem('parentProfileAddress', event.data.address);
      }
    };

    window.addEventListener('message', handleMessage);

    if (window.parent !== window) {
      window.parent.postMessage({ type: 'REQUEST_PROFILE_ADDRESS' }, '*');
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <ProfileProvider>
      <AppLayout>
        <ProfilePage />
      </AppLayout>
    </ProfileProvider>
  );
}
