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
import { Settings } from 'lucide-react';

function StorefrontContent() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [provider, setProvider] = useState<'groq' | 'openai'>('groq');
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

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
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          availableVoices={availableVoices}
          setAvailableVoices={setAvailableVoices}
        />
      </main>

      {/* Floating Settings Button for Evaluator LLM API Key config */}
      <div className="fixed bottom-4 right-4 z-30">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 p-3 rounded-2xl bg-white/90 hover:bg-white text-stone-700 border border-stone-200 shadow-lg text-xs font-semibold backdrop-blur-md transition hover:scale-105"
          title="Configure Cloud LLM or Speech Synthesis"
        >
          <Settings className="w-4 h-4 text-aura-800" />
          <span className="hidden sm:inline">Settings</span>
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
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
        availableVoices={availableVoices}
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
