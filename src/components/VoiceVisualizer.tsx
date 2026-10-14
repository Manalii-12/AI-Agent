'use client';

import React from 'react';
import { AgentState } from '@/types';
import { Phone, PhoneOff, Mic, Volume2, Loader2, Hand } from 'lucide-react';

interface VoiceVisualizerProps {
  state: AgentState;
  isCallActive: boolean;
  audioLevel: number;
  onStartCall: () => void;
  onEndCall: () => void;
  onInterrupt: () => void;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  state,
  isCallActive,
  audioLevel,
  onStartCall,
  onEndCall,
  onInterrupt,
}) => {
  // Determine state indicator labels, colors, and descriptions
  const stateConfig = {
    idle: {
      label: 'Ready to Call',
      badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
      dotClass: 'bg-stone-400',
      description: 'Click "Start Call" to speak with Aria through your microphone.',
      ringColor: 'border-stone-300',
      orbGradient: 'from-stone-200 via-stone-300 to-aura-300',
    },
    listening: {
      label: 'Listening to You...',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm shadow-emerald-500/10',
      dotClass: 'bg-emerald-500 animate-ping',
      description: 'Speak clearly into your microphone. Aria is listening...',
      ringColor: 'border-emerald-400/50',
      orbGradient: 'from-emerald-400 via-teal-500 to-sage-600',
    },
    thinking: {
      label: 'Thinking & Checking...',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm shadow-amber-500/10',
      dotClass: 'bg-amber-500 animate-pulse',
      description: 'Consulting Aura Skincare knowledge base & live mock database...',
      ringColor: 'border-amber-400/50',
      orbGradient: 'from-amber-400 via-orange-400 to-aura-600',
    },
    speaking: {
      label: 'Aria is Speaking...',
      badgeClass: 'bg-aura-100 text-aura-900 border-aura-300 shadow-sm shadow-aura-500/10',
      dotClass: 'bg-aura-700 animate-pulse',
      description: 'Listen through your speakers. You can interrupt anytime!',
      ringColor: 'border-aura-400/60',
      orbGradient: 'from-aura-500 via-rose-500 to-aura-700',
    },
  }[state];

  // Dynamic scale from audio level
  const scaleMultiplier = Math.min(1.35, 1 + (audioLevel / 255) * 0.4);

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-8 rounded-3xl bg-white/80 border border-aura-200/80 shadow-xl shadow-aura-900/5 backdrop-blur-md relative overflow-hidden transition-all">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-aura-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-sage-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Mandatory Live State Indicator Badge */}
      <div className="mb-6 flex flex-col items-center">
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs sm:text-sm font-semibold tracking-wide uppercase transition-all duration-300 ${stateConfig.badgeClass}`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${stateConfig.dotClass}`} />
          <span>{stateConfig.label}</span>
        </div>
        <p className="text-xs text-aura-600 mt-2 text-center max-w-xs transition-opacity duration-300">
          {stateConfig.description}
        </p>
      </div>

      {/* Main Interactive Avatar / Audio Visualizer Orb */}
      <div className="relative my-4 flex items-center justify-center w-52 h-52 sm:w-60 sm:h-60">
        {/* Outer Ripple Rings for Active Call */}
        {isCallActive && (
          <>
            <div
              className={`absolute inset-0 rounded-full border-2 ${stateConfig.ringColor} animate-pulse-ring pointer-events-none`}
            />
            <div
              className={`absolute -inset-4 rounded-full border ${stateConfig.ringColor} opacity-40 animate-ping pointer-events-none`}
              style={{ animationDuration: '3s' }}
            />
          </>
        )}

        {/* Central Orb */}
        <div
          className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr ${stateConfig.orbGradient} shadow-2xl flex items-center justify-center text-white transition-transform duration-150 ease-out relative z-10`}
          style={{
            transform: isCallActive && state === 'listening' ? `scale(${scaleMultiplier})` : 'scale(1)',
          }}
        >
          {state === 'idle' && <Phone className="w-12 h-12 text-stone-600/70" />}
          {state === 'listening' && (
            <div className="flex flex-col items-center gap-1">
              <Mic className="w-12 h-12 text-white animate-bounce" />
              <span className="text-[10px] font-bold tracking-wider uppercase opacity-90">Listening</span>
            </div>
          )}
          {state === 'thinking' && (
            <div className="flex flex-col items-center gap-1">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <span className="text-[10px] font-bold tracking-wider uppercase opacity-90">Processing</span>
            </div>
          )}
          {state === 'speaking' && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1 h-8">
                <span className="w-1.5 bg-white rounded-full animate-wave-bar" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 bg-white rounded-full animate-wave-bar" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 bg-white rounded-full animate-wave-bar" style={{ animationDelay: '300ms' }} />
                <span className="w-1.5 bg-white rounded-full animate-wave-bar" style={{ animationDelay: '450ms' }} />
                <span className="w-1.5 bg-white rounded-full animate-wave-bar" style={{ animationDelay: '200ms' }} />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase opacity-90">Speaking</span>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Control Buttons: Start Call / End Call / Interruption */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full max-w-sm">
        {!isCallActive ? (
          <button
            onClick={onStartCall}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-aura-800 to-aura-900 hover:from-aura-900 hover:to-stone-900 text-white font-semibold text-base shadow-lg shadow-aura-900/20 active:scale-98 transition transform cursor-pointer"
          >
            <Phone className="w-5 h-5 text-emerald-400 fill-emerald-400" />
            <span>Start Voice Call</span>
          </button>
        ) : (
          <div className="w-full flex items-center gap-2">
            <button
              onClick={onEndCall}
              className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md shadow-rose-600/20 active:scale-98 transition"
            >
              <PhoneOff className="w-4 h-4 fill-white" />
              <span>End Call</span>
            </button>

            {/* Barge-in Button: Stop Agent immediately */}
            {state === 'speaking' && (
              <button
                onClick={onInterrupt}
                className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-semibold text-xs shadow-sm transition animate-pulse"
                title="Interrupt Aria and speak now (Barge-in)"
              >
                <Hand className="w-4 h-4 text-amber-700" />
                <span>Interrupt</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
