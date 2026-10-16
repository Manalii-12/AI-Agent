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
  selectedVoiceName?: string;
  onSelectVoiceName?: (name: string) => void;
}

export const VoiceAgentSection: React.FC<VoiceAgentSectionProps> = ({
  onOpenAuth,
  apiKey,
  provider,
  selectedVoiceName,
  onSelectVoiceName,
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
    selectedVoiceName,
    onSelectVoiceName,
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
      {/* Elevated Studio Header with 1-Click Evaluation Switcher */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 mb-8 p-6 rounded-3xl bg-white/95 border border-aura-200/90 shadow-xl shadow-aura-900/5 backdrop-blur-xl relative overflow-hidden">
        {/* Soft decorative background tint */}
        <div className="absolute top-0 right-0 w-80 h-32 bg-aura-100/40 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-aura-900 via-aura-800 to-aura-600 text-white flex items-center justify-center shadow-lg shadow-aura-900/20">
            <Sparkles className="w-6 h-6 text-aura-100" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Aria <span className="text-aura-700 font-sans text-sm font-medium">— AI Voice CX Specialist</span>
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Web Speech Ready
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1 max-w-xl">
              Real-time conversational voice support with native Indian English &amp; Hinglish comprehension, order database tools, and brand guardrails.
            </p>
          </div>
        </div>

        {/* 1-Click Account Switcher for Evaluators */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 w-full lg:w-auto relative z-10 pt-3 lg:pt-0 border-t lg:border-t-0 border-aura-100">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Testing As:</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => loginAsTestUser('user-101')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                user?.id === 'user-101'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-aura-400/30'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 shadow-2xs'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${user?.id === 'user-101' ? 'bg-emerald-400' : 'bg-stone-300'}`} />
              <span>Priya S. (ORD-101)</span>
            </button>
            <button
              onClick={() => loginAsTestUser('user-102')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                user?.id === 'user-102'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-aura-400/30'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 shadow-2xs'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${user?.id === 'user-102' ? 'bg-emerald-400' : 'bg-stone-300'}`} />
              <span>Rahul V. (ORD-102)</span>
            </button>
            <button
              onClick={() => loginAsTestUser('user-103')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                user?.id === 'user-103'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-aura-400/30'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 shadow-2xs'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${user?.id === 'user-103' ? 'bg-emerald-400' : 'bg-stone-300'}`} />
              <span>Ananya P. (ORD-103)</span>
            </button>
            {summary && (
              <button
                onClick={() => setIsSummaryModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-aura-800 hover:bg-aura-900 text-white border border-aura-700 text-xs font-semibold transition cursor-pointer shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Call Summary</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Voice CX Suite: Balanced 2-Column Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visualizer & Test Helper (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
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

        {/* Right Column: Live Conversation Transcript (5 cols, Fully Contained & Responsive) */}
        <div className="lg:col-span-5 flex flex-col h-[540px] sm:h-[580px] lg:h-[620px]">
          <TranscriptFeed
            transcript={transcript}
            interimText={interimText}
            isCallActive={isCallActive}
            onSendManualText={sendManualText}
          />
        </div>
      </div>

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
