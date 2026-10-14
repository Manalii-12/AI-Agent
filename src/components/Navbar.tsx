'use client';

import React, { useState } from 'react';
import { Sparkles, ShoppingBag, User, LogIn, LogOut, ShieldCheck, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenCart }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { items } = useCart();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <div
            onClick={() => scrollToSection('brand-overview')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-aura-800 via-aura-700 to-sage-600 flex items-center justify-center shadow-md shadow-aura-900/10 text-white group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5 text-aura-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-aura-950">
                  Aura Skincare
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-sage-50 text-sage-700 border border-sage-200">
                  Organic D2C
                </span>
              </div>
              <p className="text-[11px] text-aura-600 hidden md:block">
                Pure Organic Botanicals • Voice CX Support
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-7 text-xs font-medium text-stone-600">
            <button
              onClick={() => scrollToSection('brand-overview')}
              className="hover:text-aura-900 transition"
            >
              Brand Story
            </button>
            <button
              onClick={() => scrollToSection('products-section')}
              className="hover:text-aura-900 transition"
            >
              Shop Skincare
            </button>
            <button
              onClick={() => scrollToSection('brand-policies')}
              className="hover:text-aura-900 transition"
            >
              Policies & Delivery
            </button>
            <button
              onClick={() => scrollToSection('voice-agent-section')}
              className="flex items-center gap-1.5 text-aura-900 font-semibold px-3 py-1.5 rounded-full bg-aura-100/70 border border-aura-200 hover:bg-aura-200/60 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-aura-700" />
              <span>Voice Specialist (Aria)</span>
              {isAuthenticated ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ) : (
                <span className="text-[9px] px-1 rounded bg-stone-200 text-stone-600 font-normal">Sign In</span>
              )}
            </button>
          </div>

          {/* Action Buttons: Cart & Auth */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 transition"
              title="View Cart"
            >
              <ShoppingBag className="w-4 h-4 text-aura-900" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-aura-800 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs animate-scale-in">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Auth Button / Profile Menu */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-white border border-aura-200 shadow-xs hover:border-aura-300 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-aura-800 text-white flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-aura-950 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-stone-500">{user.email}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-stone-200 shadow-xl py-2 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="font-semibold text-stone-900">{user.name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                      {user.sampleOrderId && (
                        <span className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded bg-aura-50 text-aura-800 border border-aura-200">
                          Active Order: {user.sampleOrderId}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        scrollToSection('voice-agent-section');
                      }}
                      className="w-full text-left px-4 py-2 text-aura-900 hover:bg-aura-50 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-aura-700" />
                      <span>Talk to Aria (AI Voice CX)</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-aura-800 hover:bg-aura-900 text-white text-xs font-semibold shadow-sm transition active:scale-98"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
