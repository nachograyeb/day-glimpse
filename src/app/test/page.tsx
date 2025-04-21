// src/app/test/page.tsx
'use client'

import { SimpleTestComponent } from '@/components/SimpleTestComponent';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-white text-3xl mb-8">Gradient and Animation Test Page</h1>

      {/* Simple component test */}
      <div className="mb-12">
        <h2 className="text-white text-xl mb-4">Simple Component Test:</h2>
        <SimpleTestComponent />
      </div>

      {/* Full animated component test */}
      <div className="mb-12">
        <h2 className="text-white text-xl mb-4">Full Animated Component:</h2>
        <div className="relative w-full h-[600px] bg-gradient-to-br from-purple-900 via-fuchsia-900 to-pink-900 rounded-2xl overflow-hidden flex items-center justify-center">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500/40 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-pink-500/40 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-fuchsia-500/30 rounded-full blur-2xl animate-pulse"></div>
          </div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}></div>

          {/* Content */}
          <div className="relative z-10 text-center p-8">
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-fuchsia-400">
                Connect your Universal Profile
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-pink-400 to-purple-400">
                and see what's inside
              </span>
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-fuchsia-400 mx-auto mt-6 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
