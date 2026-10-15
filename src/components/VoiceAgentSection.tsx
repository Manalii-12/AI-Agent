'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { VoiceVisualizer } from '@/components/VoiceVisualizer';
import { TestOrdersPanel } from '@/components/TestOrdersPanel';
import { TranscriptFeed } from '@/components/TranscriptFeed';
import { PostCallSummaryModal } from '@/components/PostCallSummaryModal';
import { Sparkles, Lock, LogIn, UserCheck, ShieldCheck, FileText } from 'lucide-react';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';

interface VoiceAgentSectionProps {
  onOpenAuth: () => void;
  apiKey: string;
  provider: 'groq' | 'openai';
  selectedVoice?: SpeechSynthesisVoice | null;
  setSelectedVoice?: (voice: SpeechSynthesisVoice | null) => void;
  availableVoices?: SpeechSynthesisVoice[];
  setAvailableVoices?: (voices: SpeechSynthesisVoice[]) => void;
}

export const VoiceAgentSection: React.FC<VoiceAgentSectionProps> = ({
  onOpenAuth,
  apiKey,
  provider,
  selectedVoice,
  setSelectedVoice,
  availableVoices,
  setAvailableVoices,
}) => {
  const { user, isAuthenticated, loginAsTestUser } = useAuth();
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  const {
    state,
    isCallActive,
    transcript,
    interimText,
    summary,
    isSummaryLoading,
    audioLevel,
    startCall,
    endCall,
    interruptAgent,
    sendManualText,
  } = useVoiceAgent({
    apiKey,
    provider,
    customerName: user?.name,
    selectedVoice,
    setSelectedVoice,
    availableVoices,
    setAvailableVoices,
  });

  const handleEndCall = async () => {
    await endCall();
    setIsSummaryModalOpen(true);
  };

  const handleSelectPrompt = (prompt: string) => {
    if (!isCallActive) {
      startCall().then(() => {
        setTimeout(() => {
          sendManualText(prompt);
        }, 1200);
      });
    } else {
      sendManualText(prompt);
    }
  };

  return (
    <section id="voice-agent-section" className="scroll-mt-24 py-10">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 p-4 rounded-3xl bg-white/80 border border-aura-200/80 shadow-xs backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-aura-800 to-aura-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-aura-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-aura-950">
                Aria — AI Voice Customer Support Specialist
              </h2>
              {isAuthenticated ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Unlocked for {user?.name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <Lock className="w-3 h-3" />
                  Sign In Required
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              Natural voice conversation, live order tracking, brand guardrails, and post-call analytics.
            </p>
          </div>
        </div>

        {summary && (
          <button
            onClick={() => setIsSummaryModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-aura-800 text-white hover:bg-aura-900 text-xs font-semibold shadow-xs transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Latest Call Summary</span>
          </button>
        )}
      </div>

      {/* Gated Experience: If NOT signed in, show Sign In Prompt */}
      {!isAuthenticated ? (
        <div className="rounded-3xl bg-white/90 border border-aura-200/90 p-8 sm:p-12 shadow-xl shadow-aura-900/5 backdrop-blur-md text-center max-w-2xl mx-auto my-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-aura-100 text-aura-800 flex items-center justify-center mb-4 shadow-sm">
            <Lock className="w-8 h-8 text-aura-800" />
          </div>

          <h3 className="font-serif text-xl sm:text-2xl font-bold text-aura-950">
            Sign In to Speak with Aria
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-md leading-relaxed">
            Aria provides personalized customer service tailored to your active orders, delivery updates, and skincare regimen. Please sign in to activate voice access.
          </p>

          <button
            onClick={onOpenAuth}
            className="mt-6 flex items-center gap-2 px-6 py-3 rounded-2xl bg-aura-800 hover:bg-aura-900 text-white font-semibold text-xs sm:text-sm shadow-md transition active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In or Select Test User</span>
          </button>

          {/* Quick 1-click test user shortcuts */}
          <div className="mt-8 pt-6 border-t border-stone-200 w-full text-left">
            <p className="text-[11px] font-semibold text-stone-500 mb-2 text-center uppercase tracking-wider">
              Quick 1-Click Evaluation Accounts
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => loginAsTestUser('user-101')}
                className="p-2.5 rounded-xl bg-stone-50 hover:bg-aura-50 border border-stone-200 text-left transition"
              >
                <span className="font-bold text-xs text-stone-800 block">Priya Sharma</span>
                <span className="text-[10px] text-stone-500 font-mono">ORD-101 (Out for delivery)</span>
              </button>
              <button
                onClick={() => loginAsTestUser('user-102')}
                className="p-2.5 rounded-xl bg-stone-50 hover:bg-aura-50 border border-stone-200 text-left transition"
              >
                <span className="font-bold text-xs text-stone-800 block">Rahul Verma</span>
                <span className="text-[10px] text-stone-500 font-mono">ORD-102 (Delivered 14d ago)</span>
              </button>
              <button
                onClick={() => loginAsTestUser('user-103')}
                className="p-2.5 rounded-xl bg-stone-50 hover:bg-aura-50 border border-stone-200 text-left transition"
              >
                <span className="font-bold text-xs text-stone-800 block">Ananya Patel</span>
                <span className="text-[10px] text-stone-500 font-mono">ORD-103 (Processing)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated: Full Voice CX Suite */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Visualizer & Test Helper (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <VoiceVisualizer
              state={state}
              isCallActive={isCallActive}
              audioLevel={audioLevel}
              onStartCall={startCall}
              onEndCall={handleEndCall}
              onInterrupt={interruptAgent}
            />

            <TestOrdersPanel
              onSelectPrompt={handleSelectPrompt}
              isCallActive={isCallActive}
            />
          </div>

          {/* Right Column: Live Conversation Transcript (5 cols) */}
          <div className="lg:col-span-5 flex flex-col h-[640px] lg:h-[720px]">
            <TranscriptFeed
              transcript={transcript}
              interimText={interimText}
              isCallActive={isCallActive}
              onSendManualText={sendManualText}
            />
          </div>
        </div>
      )}

      {/* Post-Call Summary Modal */}
      <PostCallSummaryModal
        summary={summary}
        transcript={transcript}
        isLoading={isSummaryLoading}
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
      />
    </section>
  );
};
