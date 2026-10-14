'use client';

import React from 'react';
import { Truck, RefreshCw, XCircle, Banknote, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { BRAND_INFO } from '@/data/brandInfo';

export const BrandPoliciesSection: React.FC = () => {
  return (
    <section id="brand-policies" className="scroll-mt-24 py-10">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-aura-700" />
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-aura-950">
            Brand Policies & Customer Guarantees
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 max-w-2xl">
          Transparent, customer-friendly policies that guide our operations and AI Customer Specialist Aria.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Shipping Policy */}
        <div className="p-5 rounded-3xl bg-white/90 border border-aura-200/80 shadow-md shadow-aura-900/5 backdrop-blur-md flex flex-col justify-between hover:border-aura-400 transition">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm text-stone-900">Shipping Policy</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                ₹499 Free
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed mt-2">
              {BRAND_INFO.policies.shipping.summary}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-blue-800 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Delivered in 3–5 business days</span>
          </div>
        </div>

        {/* Return & Refund Policy */}
        <div className="p-5 rounded-3xl bg-white/90 border border-aura-200/80 shadow-md shadow-aura-900/5 backdrop-blur-md flex flex-col justify-between hover:border-aura-400 transition">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <RefreshCw className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm text-stone-900">Return & Refund</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                7 Days
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed mt-2">
              {BRAND_INFO.policies.returnsAndRefunds.summary}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unopened products with seals</span>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="p-5 rounded-3xl bg-white/90 border border-aura-200/80 shadow-md shadow-aura-900/5 backdrop-blur-md flex flex-col justify-between hover:border-aura-400 transition">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mb-4">
              <XCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm text-stone-900">Cancellation Policy</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Processing Only
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed mt-2">
              {BRAND_INFO.policies.cancellation.summary}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-rose-800 font-medium flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Doorstep refusal if already shipped</span>
          </div>
        </div>

        {/* Cash on Delivery (COD) */}
        <div className="p-5 rounded-3xl bg-white/90 border border-aura-200/80 shadow-md shadow-aura-900/5 backdrop-blur-md flex flex-col justify-between hover:border-aura-400 transition">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <Banknote className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm text-stone-900">Cash on Delivery</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Up to ₹2,500
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed mt-2">
              {BRAND_INFO.policies.cashOnDelivery.summary}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-amber-800 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Cash or UPI scan at doorstep</span>
          </div>
        </div>
      </div>
    </section>
  );
};
