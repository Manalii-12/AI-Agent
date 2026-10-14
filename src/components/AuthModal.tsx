'use client';

import React, { useState } from 'react';
import { X, UserCheck, LogIn, UserPlus, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth, TEST_USERS } from '@/context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  reasonText?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  reasonText,
}) => {
  const { loginAsTestUser, loginWithCredentials, signup } = useAuth();
  const [activeTab, setActiveTab] = useState<'testUsers' | 'login' | 'signup'>('testUsers');

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestUserSelect = (userId: string) => {
    loginAsTestUser(userId);
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail.trim()) {
      setError('Please enter your email.');
      return;
    }
    const res = loginWithCredentials(loginEmail, loginPassword);
    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(res.error || 'Failed to sign in.');
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!signupName.trim() || !signupEmail.trim()) {
      setError('Please provide your name and email.');
      return;
    }
    const res = signup(signupName, signupEmail, signupPassword);
    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(res.error || 'Failed to create account.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base text-aura-950">Aura Skincare Account</span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {reasonText || 'Sign in to access personalized voice support with Aria.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-200/60 text-stone-500 hover:text-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 px-6 pt-2 bg-stone-50/40">
          <button
            onClick={() => {
              setActiveTab('testUsers');
              setError(null);
            }}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-semibold transition ${
              activeTab === 'testUsers'
                ? 'border-aura-800 text-aura-900 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-aura-700" />
            <span>Test Users (1-Click)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-semibold transition ${
              activeTab === 'login'
                ? 'border-aura-800 text-aura-900 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('signup');
              setError(null);
            }}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-semibold transition ${
              activeTab === 'signup'
                ? 'border-aura-800 text-aura-900 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {activeTab === 'testUsers' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-600 mb-2">
                Select one of the assessment test customers below to sign in instantly with their linked mock order:
              </p>

              {TEST_USERS.map((tu) => (
                <button
                  key={tu.id}
                  onClick={() => handleTestUserSelect(tu.id)}
                  className="w-full text-left p-3.5 rounded-2xl border border-stone-200 hover:border-aura-400 hover:bg-aura-50/50 transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-aura-100 group-hover:bg-aura-800 group-hover:text-white text-aura-800 flex items-center justify-center font-bold text-xs transition">
                      {tu.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-900">{tu.name}</p>
                      <p className="text-[11px] text-stone-500">{tu.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                      {tu.sampleOrderId}
                    </span>
                    <span className="block text-[9px] text-aura-700 font-medium mt-0.5 group-hover:underline">
                      Sign in &rarr;
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. priya@auraskincare.in"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-aura-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-aura-400"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Tip: Any password works for testing.
                </span>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl bg-aura-800 hover:bg-aura-900 text-white font-semibold text-xs shadow-md transition"
              >
                Sign In
              </button>
            </form>
          )}

          {activeTab === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Sneha Roy"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-aura-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="e.g. sneha@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-aura-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-aura-400"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl bg-aura-800 hover:bg-aura-900 text-white font-semibold text-xs shadow-md transition"
              >
                Create Account & Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
