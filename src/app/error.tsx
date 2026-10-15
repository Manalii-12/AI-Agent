'use client';

import React, { useEffect } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js Client Exception caught by Error Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-[#fdf8f6] via-[#f9f2ef] to-[#f4ebe6] text-stone-900">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-aura-200 shadow-xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-xl font-bold text-aura-950 mb-2">
          Aura Skincare Storefront
        </h2>
        <p className="text-xs text-stone-600 mb-6 leading-relaxed">
          The page encountered a temporary browser initialization glitch. Click below to reload the storefront cleanly.
        </p>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            } else {
              reset();
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-aura-800 hover:bg-aura-900 text-white font-semibold text-xs transition shadow-md active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reload Storefront</span>
        </button>
      </div>
    </div>
  );
}
