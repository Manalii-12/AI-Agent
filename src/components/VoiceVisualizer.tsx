'use client';

import React from 'react';
import { AgentState } from '@/types';
import { Phone, PhoneOff, Mic, Volume2, Loader2, Hand, Sparkles } from 'lucide-react';

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
  // State configurations for labels, colors, and descriptions
  const stateConfig = {
    idle: {
      label: 'Ready to Connect',
      badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
      dotClass: 'bg-stone-400',
      description: 'Tap "Start Voice Call" to speak directly with Aria via microphone.',
      ringColor: 'border-stone-200/80',
      orbGradient: 'from-stone-100 via-stone-200 to-aura-200',
      glowColor: 'rgba(214, 180, 162, 0.15)',
    },
    listening: {
      label: 'Listening to You...',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm shadow-emerald-500/10',
      dotClass: 'bg-emerald-500 animate-ping',
      description: 'Speak naturally in English or Hinglish. Aria is listening...',
      ringColor: 'border-emerald-400/40',
      orbGradient: 'from-emerald-400 via-teal-500 to-emerald-700',
      glowColor: 'rgba(16, 185, 129, 0.25)',
    },
    thinking: {
      label: 'Analyzing & Checking...',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm shadow-amber-500/10',
      dotClass: 'bg-amber-500 animate-pulse',
      description: 'Consulting Aura Skincare policies and checking order database...',
      ringColor: 'border-amber-400/40',
      orbGradient: 'from-amber-400 via-orange-400 to-aura-700',
      glowColor: 'rgba(245, 158, 11, 0.25)',
    },
    speaking: {
      label: 'Aria is Speaking...',
      badgeClass: 'bg-aura-100 text-aura-900 border-aura-300 shadow-sm shadow-aura-500/10',
      dotClass: 'bg-aura-700 animate-pulse',
      description: 'Aria is answering in Indian English. You can interrupt anytime!',
      ringColor: 'border-aura-400/50',
      orbGradient: 'from-aura-500 via-rose-500 to-aura-800',
      glowColor: 'rgba(163, 102, 79, 0.3)',
    },
  }[state];

  // Hardware-accelerated dynamic scale from audio level without layout shifts
  const scaleMultiplier = Math.min(1.22, 1 + (audioLevel / 255) * 0.25);

  return (
    <div className="flex flex-col items-center justify-between p-7 sm:p-9 rounded-3xl bg-white/95 border border-stone-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.04)] backdrop-blur-xl relative overflow-hidden transition-all min-h-[440px]">
      {/* Decorative ambient background glows */}
      <div
        className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700"
        style={{ backgroundColor: stateConfig.glowColor }}
      />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-aura-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Top Status Header */}
      <div className="flex flex-col items-center z-10 w-full">
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${stateConfig.badgeClass}`}
        >
          <span className={`w-2 h-2 rounded-full ${stateConfig.dotClass}`} />
          <span>{stateConfig.label}</span>
        </div>
        <p className="text-xs text-stone-500 mt-2 text-center max-w-sm transition-opacity duration-300 min-h-[20px]">
          {stateConfig.description}
        </p>
      </div>

      {/* Main Interactive Avatar Orb with Fixed Layout Bounds */}
      <div className="relative my-6 flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64 z-10">
        {/* Animated Ripple Rings for Active Call */}
        {isCallActive && (
          <>
            <div
              className={`absolute inset-0 rounded-full border-2 ${stateConfig.ringColor} animate-pulse-ring pointer-events-none`}
            />
            <div
              className={`absolute -inset-4 rounded-full border ${stateConfig.ringColor} opacity-30 animate-ping pointer-events-none`}
              style={{ animationDuration: '3.5s' }}
            />
          </>
        )}

        {/* Central Orb with Smooth GPU Transform */}
        <div
          className={`w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr ${stateConfig.orbGradient} shadow-2xl shadow-stone-900/15 flex items-center justify-center text-white transition-transform duration-100 ease-out relative`}
          style={{
            transform: isCallActive && state === 'listening' ? `scale(${scaleMultiplier})` : 'scale(1)',
          }}
        >
          {state === 'idle' && (
            <div className="flex flex-col items-center gap-2 text-stone-600">
              <div className="w-14 h-14 rounded-2xl bg-white/70 shadow-sm flex items-center justify-center text-aura-800">
                <Phone className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-stone-600">Tap to Start</span>
            </div>
          )}

          {state === 'listening' && (
            <div className="flex flex-col items-center gap-2 text-white">
              <Mic className="w-8 h-8 animate-bounce drop-shadow" />
              <div className="flex items-center gap-1">
                <span className="w-1 h-3 bg-white/90 rounded-full animate-pulse" />
                <span className="w-1 h-5 bg-white rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                <span className="w-1 h-7 bg-white rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                <span className="w-1 h-4 bg-white/90 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase opacity-90">Listening</span>
            </div>
          )}

          {state === 'thinking' && (
            <div className="flex flex-col items-center gap-2 text-white">
              <Loader2 className="w-8 h-8 animate-spin drop-shadow" />
              <span className="text-[10px] font-bold tracking-wider uppercase opacity-90">Thinking</span>
            </div>
          )}

          {state === 'speaking' && (
            <div className="flex flex-col items-center gap-2 text-white">
              <div className="flex items-center gap-1.5 h-7">
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

      {/* Audio Level Equalizer Indicator (Active Call) */}
      <div className="w-full max-w-xs flex items-center justify-center gap-1 h-4 z-10 mb-2">
        {isCallActive ? (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-stone-100/90 border border-stone-200/60 text-[10px] text-stone-600 font-medium">
            <span className="text-[9px] uppercase tracking-wider text-stone-500 font-bold">Audio:</span>
            <div className="flex items-center gap-0.5">
              {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold, idx) => (
                <span
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    audioLevel / 255 >= threshold ? 'h-3 bg-emerald-500' : 'h-1.5 bg-stone-300'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-stone-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-aura-600" />
            <span>Aura Skincare Intelligent Customer Voice CX</span>
          </div>
        )}
      </div>

      {/* Control Buttons: Start Call / End Call / Barge-in */}
      <div className="w-full max-w-sm z-10 mt-2">
        {!isCallActive ? (
          <button
            onClick={onStartCall}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-stone-900 hover:bg-black text-white font-semibold text-sm shadow-xl shadow-stone-900/10 active:scale-98 transition transform cursor-pointer border border-stone-800 group"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Phone className="w-3.5 h-3.5 fill-current" />
            </div>
            <span>Start Voice Call with Aria</span>
          </button>
        ) : (
          <div className="w-full flex items-center gap-2.5">
            <button
              onClick={onEndCall}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-rose-600/20 active:scale-98 transition cursor-pointer"
            >
              <PhoneOff className="w-4 h-4 fill-white" />
              <span>End Call</span>
            </button>

            {/* Barge-in / Interruption Button */}
            {state === 'speaking' && (
              <button
                onClick={onInterrupt}
                className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs shadow-sm transition active:scale-95 cursor-pointer animate-pulse"
                title="Interrupt Aria and speak now"
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
