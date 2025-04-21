// src/app/page.tsx
'use client'

import { useEffect } from 'react';
import { ConnectProfile } from '@/components/ConnectProfile';

export default function Home() {
  useEffect(() => {
    // Listen for messages from parent window to get the current profile
    const handleMessage = (event: MessageEvent) => {
      // Add security check for origin
      const allowedOrigins = ['https://universaleverything.io', 'http://localhost:3000'];
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }

      if (event.data.type === 'PARENT_PROFILE_ADDRESS') {
        // Store the parent profile address in localStorage for the ConnectProfile component
        localStorage.setItem('parentProfileAddress', event.data.address);
      }
    };

    window.addEventListener('message', handleMessage);

    // Request parent profile address on load
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'REQUEST_PROFILE_ADDRESS' }, '*');
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <main className="w-full h-screen max-w-2xl p-4">
        <ConnectProfile />
      </main>
    </div>
  );
}
