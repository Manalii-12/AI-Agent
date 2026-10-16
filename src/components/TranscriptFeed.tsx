'use client';

import React, { useRef, useEffect, useState } from 'react';
import { TranscriptMessage } from '@/types';
import { User, Sparkles, Send, Database, CheckCircle2, XCircle, Bot, Mic } from 'lucide-react';

interface TranscriptFeedProps {
  transcript: TranscriptMessage[];
  interimText: string;
  isCallActive: boolean;
  onSendManualText: (text: string) => void;
}

export const TranscriptFeed: React.FC<TranscriptFeedProps> = ({
  transcript,
  interimText,
  isCallActive,
  onSendManualText,
}) => {
  const [inputText, setInputText] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ONLY the inner chat messages container — NEVER scrolls the outer window!
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [transcript, interimText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendManualText(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/95 border border-stone-200/90 rounded-3xl p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all overflow-hidden">
      {/* Feed Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-aura-800 to-aura-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-aura-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm text-stone-900 tracking-tight">Live Conversation Log</h3>
              {isCallActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400">Real-time speech recognition &amp; tool audit trail</p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-stone-500 bg-stone-100/80 px-2.5 py-1 rounded-full border border-stone-200/60">
          {transcript.length} {transcript.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      {/* Messages Scroll Area - Responsive, Internal Scroll Only */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-3.5 pr-2 min-h-0"
      >
        {transcript.length === 0 && !interimText && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 text-stone-400">
            <div className="w-12 h-12 rounded-2xl bg-aura-50 border border-aura-200/60 flex items-center justify-center text-aura-700 mb-3 shadow-xs">
              <Bot className="w-6 h-6 text-aura-800" />
            </div>
            <p className="text-sm font-serif font-bold text-stone-800">Aria is ready to assist</p>
            <p className="text-xs text-stone-500 max-w-xs mt-1.5 leading-relaxed">
              Click <strong className="text-stone-800">&quot;Start Voice Call&quot;</strong> to speak naturally through your microphone, or choose a test prompt below.
            </p>
          </div>
        )}

        {transcript.map((msg) => {
          const isAgent = msg.sender === 'agent';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'} transition-all`}
            >
              {/* Sender Name & Timestamp Header */}
              <div className="flex items-center gap-1.5 mb-1 px-1.5 text-[11px]">
                {isAgent ? (
                  <>
                    <span className="w-4 h-4 rounded-full bg-aura-800 text-white flex items-center justify-center text-[9px] font-bold shadow-2xs">
                      A
                    </span>
                    <span className="font-semibold text-aura-950">Aria (Support Specialist)</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-stone-700">You (Customer)</span>
                    <span className="w-4 h-4 rounded-full bg-stone-700 text-white flex items-center justify-center text-[9px]">
                      <User className="w-2.5 h-2.5" />
                    </span>
                  </>
                )}
                <span className="text-[10px] text-stone-400 ml-1 font-mono">{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isAgent
                    ? 'bg-[#fdfaf7] text-stone-900 border border-[#ecd9cd] rounded-tl-xs font-normal'
                    : 'bg-stone-900 text-white rounded-tr-xs font-light tracking-wide shadow-stone-900/10'
                }`}
              >
                {msg.text}
              </div>

              {/* Attached Tool Execution Callout Card */}
              {msg.toolCall && (
                <div className="mt-2 max-w-[88%] rounded-2xl bg-amber-50/90 border border-amber-200/90 p-3 text-[11px] text-amber-950 shadow-xs">
                  <div className="flex items-center justify-between font-mono font-bold text-amber-900 mb-1.5 pb-1 border-b border-amber-200/60">
                    <div className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-amber-700" />
                      <span>{msg.toolCall.name}()</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-900">
                      Executed
                    </span>
                  </div>

                  {msg.toolCall.args && Object.keys(msg.toolCall.args).length > 0 && (
                    <div className="text-[10px] font-mono text-amber-800 bg-amber-100/70 p-2 rounded-xl mb-1.5 break-all">
                      {JSON.stringify(msg.toolCall.args)}
                    </div>
                  )}

                  <div className="text-[11px] flex items-start gap-1.5 pt-0.5 text-stone-700">
                    {msg.toolCall.result?.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-snug">{msg.toolCall.result?.message || 'Completed'}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Real-time speech recognition interim transcript (STABLE, non-jumping) */}
        {interimText && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-semibold text-emerald-700 mb-1 flex items-center gap-1">
              <Mic className="w-3 h-3 text-emerald-600 animate-pulse" />
              Speaking now...
            </span>
            <div className="max-w-[85%] rounded-2xl rounded-tr-xs px-4 py-2.5 bg-emerald-50 text-emerald-900 text-xs italic border border-emerald-200/80 shadow-xs">
              &quot;{interimText}...&quot;
            </div>
          </div>
        )}
      </div>

      {/* Manual Prompt Input for rapid test verification */}
      <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isCallActive ? "Type your message or speak naturally..." : "Type a query to test Aria..."}
          className="flex-1 px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-aura-400 focus:bg-white text-stone-800 transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-aura-800 hover:bg-aura-900 disabled:opacity-30 text-white text-xs transition cursor-pointer shadow-xs active:scale-95"
          title="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
