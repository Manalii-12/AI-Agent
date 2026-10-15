'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, RotateCcw, Volume2, Cpu, Check } from 'lucide-react';
import { resetMockOrders } from '@/data/mockOrders';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  provider: 'groq' | 'openai';
  setProvider: (provider: 'groq' | 'openai') => void;
  selectedVoiceName?: string;
  onSelectVoiceName?: (name: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  provider,
  setProvider,
  selectedVoiceName = '',
  onSelectVoiceName,
}) => {
  const [tempKey, setTempKey] = useState(apiKey);
  const [resetMessage, setResetMessage] = useState(false);
  const [isPlayingTestVoice, setIsPlayingTestVoice] = useState(false);
  const [voices, setVoices] = useState<{ name: string; lang: string }[]>([]);

  // Load voices safely when modal opens
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      try {
        const rawVoices = window.speechSynthesis.getVoices() || [];
        const valid = rawVoices
          .filter((v) => v && typeof v.name === 'string')
          .map((v) => ({
            name: v.name || '',
            lang: v.lang || '',
          }));

        valid.sort((a, b) => {
          const aLang = (a.lang || '').toLowerCase();
          const bLang = (b.lang || '').toLowerCase();
          const aName = (a.name || '').toLowerCase();
          const bName = (b.name || '').toLowerCase();

          const aIsNatural = aName.includes('natural') || aName.includes('online') || aName.includes('neural');
          const bIsNatural = bName.includes('natural') || bName.includes('online') || bName.includes('neural');
          if (aIsNatural && !bIsNatural) return -1;
          if (!aIsNatural && bIsNatural) return 1;

          const aIsEn = aLang.startsWith('en');
          const bIsEn = bLang.startsWith('en');
          if (aIsEn && !bIsEn) return -1;
          if (!aIsEn && bIsEn) return 1;

          return aName.localeCompare(bName);
        });

        setVoices(valid);
      } catch (e) {
        console.warn('Failed to load voices in SettingsModal:', e);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestVoice = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const testText = "Aura Skincare provides natural organic protection for bright summer days.";
      const utterance = new SpeechSynthesisUtterance(testText);

      if (selectedVoiceName) {
        const allVoices = window.speechSynthesis.getVoices() || [];
        const match = allVoices.find((v) => v && v.name === selectedVoiceName);
        if (match) {
          utterance.voice = match;
          utterance.lang = match.lang || 'en-IN';
        }
      }

      utterance.rate = 0.98;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsPlayingTestVoice(true);
      utterance.onend = () => setIsPlayingTestVoice(false);
      utterance.onerror = () => setIsPlayingTestVoice(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setIsPlayingTestVoice(false);
    }
  };

  const handleSave = () => {
    setApiKey(tempKey.trim());
    onClose();
  };

  const handleResetOrders = () => {
    resetMockOrders();
    setResetMessage(true);
    setTimeout(() => setResetMessage(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-aura-800" />
            <h3 className="font-serif font-bold text-base text-aura-950">Engine & Voice Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-200/60 text-stone-500 hover:text-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-stone-700">
          {/* Intelligence Engine */}
          <div>
            <label className="font-semibold text-stone-900 block mb-1.5">Intelligence Mode</label>
            <p className="text-[11px] text-stone-500 mb-2">
              The agent works out-of-the-box with our high-speed local engine. You can also provide an OpenAI or Groq API key for cloud LLM inference.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setProvider('groq')}
                className={`py-2 px-3 rounded-xl border text-center font-medium transition ${
                  provider === 'groq'
                    ? 'border-aura-700 bg-aura-50 text-aura-900 font-semibold'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                ⚡ Groq (Ultra-Low Latency)
              </button>
              <button
                type="button"
                onClick={() => setProvider('openai')}
                className={`py-2 px-3 rounded-xl border text-center font-medium transition ${
                  provider === 'openai'
                    ? 'border-aura-700 bg-aura-50 text-aura-900 font-semibold'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                🧠 OpenAI (GPT-4o mini)
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="w-3.5 h-3.5 text-stone-400" />
              </div>
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="Optional API Key (or leave blank to use Built-in Engine)"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-aura-400 text-xs"
              />
            </div>
            <span className="text-[10px] text-stone-400 block mt-1">
              Tip: Can also be set in <code className="bg-stone-100 px-1 py-0.5 rounded">.env.local</code> as <code className="bg-stone-100 px-1 py-0.5 rounded">GROQ_API_KEY</code> or <code className="bg-stone-100 px-1 py-0.5 rounded">OPENAI_API_KEY</code>.
            </span>
          </div>

          {/* Voice Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-stone-900 block">
                Spoken Voice (High-Clarity English)
              </label>
              <button
                type="button"
                onClick={handleTestVoice}
                disabled={isPlayingTestVoice}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-aura-100 hover:bg-aura-200 text-aura-900 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isPlayingTestVoice ? 'animate-bounce text-aura-700' : 'text-aura-800'}`} />
                <span>{isPlayingTestVoice ? 'Testing Voice...' : 'Test Voice ("summer")'}</span>
              </button>
            </div>
            <div className="relative">
              <select
                value={selectedVoiceName}
                onChange={(e) => {
                  if (onSelectVoiceName) {
                    onSelectVoiceName(e.target.value);
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-aura-400 text-xs bg-white text-stone-800 font-medium"
              >
                {voices.length === 0 ? (
                  <option value="">Browser Default Voice</option>
                ) : (
                  voices.map((v) => {
                    const name = v.name || 'Voice';
                    const lang = (v.lang || '').toLowerCase();
                    const isEn = lang.startsWith('en');
                    const isNatural = name.toLowerCase().includes('natural') || name.toLowerCase().includes('online') || name.toLowerCase().includes('neural');
                    const prefix = isNatural ? '⭐ [Natural] ' : isEn ? '🗣️ [English] ' : '🌐 ';
                    return (
                      <option key={name} value={name}>
                        {prefix}{name} {v.lang ? `(${v.lang})` : ''}
                      </option>
                    );
                  })
                )}
              </select>
            </div>
            <p className="text-[10px] text-stone-500 mt-1.5 leading-normal">
              Select an English voice (e.g. Microsoft Neerja Online Natural, Google UK English, or Google US English). Natural online voices provide crystal-clear English pronunciation without robotic accents.
            </p>
          </div>

          {/* Reset Mock Orders */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-stone-800">Reset Mock Database</p>
              <p className="text-[11px] text-stone-500">Restore ORD-101, ORD-102, ORD-103 to initial test state</p>
            </div>
            <button
              onClick={handleResetOrders}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 transition"
            >
              {resetMessage ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Reset Done</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
                  <span>Reset Orders</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-stone-100 flex items-center justify-end gap-2 bg-stone-50/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-aura-800 hover:bg-aura-900 text-white font-semibold transition"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
