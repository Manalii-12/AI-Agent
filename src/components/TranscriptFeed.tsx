'use client';

import React, { useRef, useEffect, useState } from 'react';
import { TranscriptMessage } from '@/types';
import { User, Sparkles, Send, Database, CheckCircle2, XCircle } from 'lucide-react';

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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, interimText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendManualText(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/90 border border-aura-200/80 rounded-3xl p-5 shadow-lg shadow-aura-900/5 backdrop-blur-md">
      {/* Feed Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-aura-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-sage-500" />
          <h2 className="font-semibold text-sm text-aura-900">Live Conversation Transcript</h2>
        </div>
        <span className="text-[11px] text-aura-500">
          {transcript.length} {transcript.length === 1 ? 'turn' : 'turns'}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 max-h-[380px] min-h-[220px]">
        {transcript.length === 0 && !interimText && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-aura-400">
            <Sparkles className="w-8 h-8 mb-2 opacity-50 text-aura-500" />
            <p className="text-sm font-medium">No conversation yet</p>
            <p className="text-xs text-aura-400 max-w-xs mt-1">
              Click &quot;Start Call&quot; or select one of the sample test order prompts below to begin.
            </p>
          </div>
        )}

        {transcript.map((msg) => {
          const isAgent = msg.sender === 'agent';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'} animate-fade-in`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {isAgent ? (
                  <>
                    <span className="w-4 h-4 rounded-full bg-aura-700 text-white flex items-center justify-center text-[9px] font-bold">
                      A
                    </span>
                    <span className="text-[11px] font-medium text-aura-900">Aria (Support)</span>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] font-medium text-stone-700">You (Customer)</span>
                    <span className="w-4 h-4 rounded-full bg-stone-500 text-white flex items-center justify-center text-[9px]">
                      <User className="w-2.5 h-2.5" />
                    </span>
                  </>
                )}
                <span className="text-[10px] text-stone-400 ml-1">{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isAgent
                    ? 'bg-aura-50/90 text-aura-950 border border-aura-200/80 rounded-tl-sm'
                    : 'bg-stone-800 text-white rounded-tr-sm'
                }`}
              >
                {msg.text}
              </div>

              {/* Attached Tool Execution Callout Card */}
              {msg.toolCall && (
                <div className="mt-1.5 max-w-[85%] rounded-xl bg-amber-50/80 border border-amber-200/80 p-2.5 text-[11px] text-amber-900 font-mono">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950 mb-1">
                    <Database className="w-3.5 h-3.5 text-amber-700" />
                    <span>Tool Called: {msg.toolCall.name}()</span>
                  </div>
                  <div className="text-[10px] text-amber-800 bg-amber-100/60 p-1.5 rounded">
                    Args: {JSON.stringify(msg.toolCall.args)}
                  </div>
                  <div className="mt-1 text-[10px] flex items-center gap-1">
                    {msg.toolCall.result?.success ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-rose-600" />
                    )}
                    <span className="truncate">{msg.toolCall.result?.message}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Real-time speech recognition interim transcript */}
        {interimText && (
          <div className="flex flex-col items-end animate-pulse">
            <span className="text-[10px] text-stone-400 mb-1">Listening in real-time...</span>
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2 bg-stone-200/80 text-stone-700 text-xs italic border border-stone-300">
              &quot;{interimText}...&quot;
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Manual Prompt Input for rapid test verification */}
      <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-aura-100 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isCallActive ? "Type query or speak into mic..." : "Type query to test Aria..."}
          className="flex-1 px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-aura-400 focus:bg-white text-stone-800"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-aura-800 hover:bg-aura-900 disabled:opacity-40 text-white text-xs transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
