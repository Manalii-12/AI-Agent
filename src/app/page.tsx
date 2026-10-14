'use client';

import React, { useState } from 'react';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import { Header } from '@/components/Header';
import { VoiceVisualizer } from '@/components/VoiceVisualizer';
import { TestOrdersPanel } from '@/components/TestOrdersPanel';
import { TranscriptFeed } from '@/components/TranscriptFeed';
import { PostCallSummaryModal } from '@/components/PostCallSummaryModal';
import { SettingsModal } from '@/components/SettingsModal';
import { BrandPoliciesModal } from '@/components/BrandPoliciesModal';
import { FileText, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [apiKey, setApiKey] = useState<string>('');
  const [provider, setProvider] = useState<'groq' | 'openai'>('groq');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPoliciesOpen, setIsPoliciesOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  const {
    state,
    isCallActive,
    transcript,
    interimText,
    summary,
    isSummaryLoading,
    selectedVoice,
    setSelectedVoice,
    availableVoices,
    audioLevel,
    startCall,
    endCall,
    interruptAgent,
    sendManualText,
  } = useVoiceAgent({
    apiKey,
    provider,
  });

  // Automatically open summary modal when call ends and summary is generated
  const handleEndCall = async () => {
    await endCall();
    setIsSummaryModalOpen(true);
  };

  const handleSelectPrompt = (prompt: string) => {
    if (!isCallActive) {
      // If call is not started yet, automatically start call and send prompt
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
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-[#fdf8f6] via-[#f9f2ef] to-[#f4ebe6] text-stone-900 selection:bg-aura-300">
      {/* Top Navigation */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPolicies={() => setIsPoliciesOpen(true)}
        isCallActive={isCallActive}
      />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Banner / Assessment Context */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/70 border border-aura-200/60 shadow-xs backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-aura-100 text-aura-800">
              <Sparkles className="w-4 h-4 text-aura-700" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-stone-900">
                Aura Skincare AI Voice Customer Support (Aria)
              </h1>
              <p className="text-xs text-stone-600">
                Voice interaction, brand policy enforcement, live tool calling, and post-call structured summary.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {summary && (
              <button
                onClick={() => setIsSummaryModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-aura-800 text-white hover:bg-aura-900 text-xs font-medium shadow-sm transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Call Summary & JSON</span>
              </button>
            )}
            <button
              onClick={() => setIsPoliciesOpen(true)}
              className="text-xs text-aura-800 hover:text-aura-950 font-medium underline underline-offset-4 px-2"
            >
              Brand Guardrails
            </button>
          </div>
        </div>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Voice Visualizer & Helper Card (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Visualizer & Call Controls */}
            <VoiceVisualizer
              state={state}
              isCallActive={isCallActive}
              audioLevel={audioLevel}
              onStartCall={startCall}
              onEndCall={handleEndCall}
              onInterrupt={interruptAgent}
            />

            {/* Test Orders Helper Card (Mandated by Section 2.E) */}
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
      </div>

      {/* Post-Call Summary Modal (Mandated by Section 2.D) */}
      <PostCallSummaryModal
        summary={summary}
        transcript={transcript}
        isLoading={isSummaryLoading}
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
      />

      {/* Settings Modal */}
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

      {/* Brand Policies & Knowledge Base Modal */}
      <BrandPoliciesModal
        isOpen={isPoliciesOpen}
        onClose={() => setIsPoliciesOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-aura-200/60 py-4 px-6 text-center text-xs text-stone-500 bg-white/40">
        <p>Aura Skincare AI Voice CX Agent • Built for DataStraw Hiring Assessment</p>
      </footer>
    </main>
  );
}
