'use client';

import React, { useState } from 'react';
import { CallSummaryOutcome, TranscriptMessage } from '@/types';
import { X, Check, Copy, FileText, Code2, Download, CheckCircle2, AlertCircle } from 'lucide-react';

interface PostCallSummaryModalProps {
  summary: CallSummaryOutcome | null;
  transcript: TranscriptMessage[];
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const PostCallSummaryModal: React.FC<PostCallSummaryModalProps> = ({
  summary,
  transcript,
  isLoading,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'json' | 'transcript'>('json');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const jsonString = summary ? JSON.stringify(summary, null, 2) : '{}';

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-summary-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base text-aura-950">Post-Call Summary & Audit</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Call Completed
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Chronological transcript & structured JSON outcome (Section 2.D Specification)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-200/60 text-stone-500 hover:text-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Callout Banner */}
        {summary && (
          <div className="px-6 py-3 bg-aura-50/60 border-b border-aura-100/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-stone-500">Intent:</span>
              <span className="font-mono font-semibold px-2 py-0.5 rounded bg-white text-aura-900 border border-aura-200">
                {summary.customer_intent}
              </span>
              {summary.order_id && (
                <>
                  <span className="text-stone-500">Order:</span>
                  <span className="font-mono font-semibold px-2 py-0.5 rounded bg-white text-stone-800 border border-stone-200">
                    {summary.order_id}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500">Resolution:</span>
              <span
                className={`font-semibold px-2.5 py-0.5 rounded-full text-[11px] ${
                  summary.resolution_status === 'RESOLVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : summary.resolution_status === 'POLICY_DENIED'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-stone-200 text-stone-800'
                }`}
              >
                {summary.resolution_status}
              </span>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 px-6 pt-2 bg-stone-50/30">
          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-semibold transition ${
              activeTab === 'json'
                ? 'border-aura-700 text-aura-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Structured Outcome (JSON)</span>
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-semibold transition ${
              activeTab === 'transcript'
                ? 'border-aura-700 text-aura-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Call Transcript ({transcript.length} turns)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 max-h-[50vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-stone-500">
              <div className="w-8 h-8 border-2 border-aura-700 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Synthesizing post-call transcript & JSON outcome...</p>
            </div>
          ) : activeTab === 'json' ? (
            <div className="space-y-4">
              {summary && (
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700">
                  <p className="font-semibold text-stone-900 mb-1">Executive Summary:</p>
                  <p>{summary.call_summary}</p>
                </div>
              )}

              <div className="relative">
                <div className="flex items-center justify-between px-3 py-1.5 bg-stone-900 text-stone-300 rounded-t-xl text-[11px] font-mono">
                  <span>Structured Output (JSON)</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 hover:text-white transition"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1 hover:text-white transition"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <pre className="p-4 bg-stone-950 text-emerald-400 rounded-b-xl text-xs font-mono overflow-x-auto shadow-inner leading-relaxed">
                  {jsonString}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {transcript.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-xl text-xs border ${
                    msg.sender === 'agent'
                      ? 'bg-aura-50/70 border-aura-200 text-aura-950'
                      : 'bg-stone-50 border-stone-200 text-stone-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-[10px] text-stone-500 font-semibold uppercase tracking-wider">
                    <span>{msg.sender === 'agent' ? 'Aria (Aura Skincare Support)' : 'Customer'}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{msg.text}</p>
                  {msg.toolCall && (
                    <div className="mt-2 pt-2 border-t border-aura-200/60 font-mono text-[10px] text-stone-600">
                      Executed Tool: <span className="font-bold">{msg.toolCall.name}</span>({JSON.stringify(msg.toolCall.args)})
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-stone-100 flex items-center justify-end gap-2 bg-stone-50/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold transition"
          >
            Close & Continue Testing
          </button>
        </div>
      </div>
    </div>
  );
};
