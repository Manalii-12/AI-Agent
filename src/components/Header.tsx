'use client';

import React from 'react';
import { Sparkles, Settings, BookOpen, ShieldCheck, PhoneCall } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenPolicies: () => void;
  isCallActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenPolicies, isCallActive }) => {
  return (
    <header className="border-b border-aura-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-aura-700 via-aura-600 to-sage-600 flex items-center justify-center shadow-md shadow-aura-700/10 text-white">
            <Sparkles className="w-5 h-5 text-aura-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg tracking-tight text-aura-900">
                Aura Skincare
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sage-50 text-sage-700 border border-sage-200">
                AI Voice CX
              </span>
            </div>
            <p className="text-xs text-aura-600 hidden sm:block">
              Aria • Customer Support Specialist (Indian Voice)
            </p>
          </div>
        </div>

        {/* Status indicator and action buttons */}
        <div className="flex items-center gap-2.5">
          {isCallActive ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Call in Progress</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-aura-100/80 text-aura-700 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-sage-600" />
              <span>Guardrails Active</span>
            </div>
          )}

          <button
            onClick={onOpenPolicies}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-aura-50 text-aura-800 border border-aura-200 text-xs font-medium transition shadow-sm"
            title="View Aura Skincare Policies & Guardrails"
          >
            <BookOpen className="w-3.5 h-3.5 text-aura-600" />
            <span className="hidden sm:inline">Brand Policies</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-white hover:bg-aura-50 text-aura-800 border border-aura-200 text-xs font-medium transition shadow-sm"
            title="Voice & Engine Settings"
          >
            <Settings className="w-4 h-4 text-aura-600" />
          </button>
        </div>
      </div>
    </header>
  );
};
