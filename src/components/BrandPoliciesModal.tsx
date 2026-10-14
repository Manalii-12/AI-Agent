'use client';

import React from 'react';
import { X, ShieldCheck, Truck, RefreshCw, XCircle, Banknote, UserCheck } from 'lucide-react';
import { BRAND_INFO } from '@/data/brandInfo';

interface BrandPoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandPoliciesModal: React.FC<BrandPoliciesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sage-600" />
            <h3 className="font-serif font-bold text-base text-aura-950">Aura Skincare Brand Knowledge & Guardrails</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-200/60 text-stone-500 hover:text-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-stone-700">
          {/* Persona Card */}
          <div className="p-3.5 rounded-2xl bg-aura-50/60 border border-aura-200/80">
            <div className="flex items-center gap-2 font-semibold text-aura-950 mb-1">
              <UserCheck className="w-4 h-4 text-aura-700" />
              <span>Persona: Aria from Aura Skincare</span>
            </div>
            <p className="text-[11px] text-aura-800 leading-relaxed">
              Friendly, professional, and concise Indian customer support specialist. Answers customer queries concisely (1-3 sentences), understands normal conversational speech and Hinglish, and enforces brand policies gracefully without hallucinating or making promises outside policy.
            </p>
          </div>

          {/* Shipping Policy */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2 font-semibold text-stone-900 mb-1">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Shipping Policy</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              {BRAND_INFO.policies.shipping.summary}
            </p>
          </div>

          {/* Return & Refund Policy */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2 font-semibold text-stone-900 mb-1">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>Return & Refund Policy</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              {BRAND_INFO.policies.returnsAndRefunds.summary}
            </p>
          </div>

          {/* Cancellation Policy */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2 font-semibold text-stone-900 mb-1">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Cancellation Policy</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              {BRAND_INFO.policies.cancellation.summary}
            </p>
          </div>

          {/* Cash on Delivery */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2 font-semibold text-stone-900 mb-1">
              <Banknote className="w-4 h-4 text-amber-600" />
              <span>Cash on Delivery (COD)</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              {BRAND_INFO.policies.cashOnDelivery.summary}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-stone-100 flex items-center justify-end bg-stone-50/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-semibold transition text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
