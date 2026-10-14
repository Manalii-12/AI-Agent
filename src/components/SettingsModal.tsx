'use client';

import React, { useState } from 'react';
import { X, Key, Mic, RotateCcw, Volume2, Cpu, Check } from 'lucide-react';
import { resetMockOrders } from '@/data/mockOrders';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  provider: 'groq' | 'openai';
  setProvider: (provider: 'groq' | 'openai') => void;
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice) => void;
  availableVoices: SpeechSynthesisVoice[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  provider,
  setProvider,
  selectedVoice,
  setSelectedVoice,
  availableVoices,
}) => {
  const [tempKey, setTempKey] = useState(apiKey);
  const [resetMessage, setResetMessage] = useState(false);

  if (!isOpen) return null;

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
            <label className="font-semibold text-stone-900 block mb-1.5">
              Spoken Voice (Indian English Preferred)
            </label>
            <div className="relative">
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = availableVoices.find((v) => v.name === e.target.value);
                  if (voice) setSelectedVoice(voice);
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-aura-400 text-xs bg-white"
              >
                {availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              Voices are populated by your operating system/browser. Indian voices like Microsoft Neerja/Heera or Google हिन्दी are prioritized.
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
