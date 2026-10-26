'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider, useCart } from '@/context/CartContext';
import { Navbar } from '@/components/Navbar';
import { BrandOverviewSection } from '@/components/BrandOverviewSection';
import { BrandPoliciesSection } from '@/components/BrandPoliciesSection';
import { ProductCatalogSection } from '@/components/ProductCatalogSection';
import { VoiceAgentSection } from '@/components/VoiceAgentSection';
import { AuthModal } from '@/components/AuthModal';
import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { SettingsModal } from '@/components/SettingsModal';
import { Order } from '@/types';
import { Mic, Sparkles, Settings } from 'lucide-react';

function StorefrontContent() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [provider, setProvider] = useState<'groq' | 'openai'>('groq');
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('en-IN-NeerjaExpressiveNeural');

  const { user } = useAuth();

  const handleOrderSuccess = (order: Order) => {
    console.log('Order successfully placed:', order);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#fdf8f6] via-[#f9f2ef] to-[#f4ebe6] text-stone-900 selection:bg-aura-300">
      {/* Top Navbar */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8 pb-16">
        {/* 1. Public Brand Overview Section */}
        <BrandOverviewSection />

        {/* 2. Public Skincare Product Catalog (Add to Cart) */}
        <ProductCatalogSection onOpenCart={() => setIsCartOpen(true)} />

        {/* 3. Public Brand Policies (Shipping, Return, Cancellation, COD) */}
        <BrandPoliciesSection />

        {/* 4. Voice Assistant Section (Aria) - Requires Sign In */}
        <VoiceAgentSection
          onOpenAuth={() => setIsAuthOpen(true)}
          apiKey={apiKey}
          provider={provider}
          selectedVoiceName={selectedVoiceName}
          onSelectVoiceName={setSelectedVoiceName}
        />
      </main>

      {/* Floating Voice Assistant Button (Redirects to Voice Assistant Section) */}
      <div className="fixed bottom-5 right-5 z-30">
        <button
          onClick={() => {
            const el = document.getElementById('voice-agent-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-stone-900 hover:bg-black text-white shadow-2xl shadow-stone-900/30 border border-stone-700/80 text-xs font-semibold backdrop-blur-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer group"
          title="Talk to Aria — AI Voice Assistant"
        >
          <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-tr from-aura-700 to-aura-500 text-white shadow-xs">
            <Mic className="w-4 h-4 text-aura-100 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="tracking-wide">Voice Assistant</span>
        </button>
      </div>

      {/* Modals & Drawers */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false);
          const el = document.getElementById('voice-agent-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        provider={provider}
        setProvider={setProvider}
        selectedVoiceName={selectedVoiceName}
        onSelectVoiceName={setSelectedVoiceName}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-aura-200/60 py-6 px-6 text-center text-xs text-stone-500 bg-white/40">
        <p className="font-semibold text-aura-900">Aura Skincare • AI Voice Customer Support</p>
        <p className="text-[11px] text-stone-400 mt-1">
          Hiring Assignment for DataStraw • Built with Next.js 14, Web Speech API, and Tool Calling
        </p>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <CartProvider>
        <StorefrontContent />
      </CartProvider>
    </AuthProvider>
  );
}
