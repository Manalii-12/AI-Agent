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
      {/* Section Header */}
      {/* Section Header with 1-Click Evaluation Customer Switcher */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 p-5 rounded-3xl bg-white/90 border border-aura-200/90 shadow-md shadow-aura-900/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-aura-800 to-aura-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 text-aura-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-aura-950">
                Aria — AI Voice Customer Support Specialist
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live &amp; Ready
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Natural voice conversation, live order tracking, brand guardrails, and post-call analytics.
            </p>
          </div>
        </div>

        {/* 1-Click Account Switcher for Evaluators */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <span className="text-[11px] font-semibold text-stone-500 mr-1">Testing As:</span>
          <button
            onClick={() => loginAsTestUser('user-101')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              user?.id === 'user-101'
                ? 'bg-aura-800 text-white border-aura-800 shadow-xs'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            Priya S. (ORD-101)
          </button>
          <button
            onClick={() => loginAsTestUser('user-102')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              user?.id === 'user-102'
                ? 'bg-aura-800 text-white border-aura-800 shadow-xs'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            Rahul V. (ORD-102)
          </button>
          <button
            onClick={() => loginAsTestUser('user-103')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              user?.id === 'user-103'
                ? 'bg-aura-800 text-white border-aura-800 shadow-xs'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            Ananya P. (ORD-103)
          </button>
          {summary && (
            <button
              onClick={() => setIsSummaryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-aura-100 text-aura-900 border border-aura-300 hover:bg-aura-200 text-xs font-semibold transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Summary</span>
            </button>
          )}
        </div>
      </div>

      {/* Voice CX Suite: Directly Accessible to Evaluator on First Load */}
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
