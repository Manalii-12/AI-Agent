'use client';

import React from 'react';
import { Sparkles, Leaf, ShieldCheck, HeartHandshake, Award } from 'lucide-react';
import { BRAND_INFO } from '@/data/brandInfo';

export const BrandOverviewSection: React.FC = () => {
  return (
    <section id="brand-overview" className="scroll-mt-24 pt-6 pb-12">
      <div className="rounded-3xl bg-gradient-to-br from-white/95 via-aura-50/70 to-sage-50/60 border border-aura-200/80 p-8 sm:p-12 shadow-xl shadow-aura-900/5 backdrop-blur-md relative overflow-hidden">
        {/* Decorative blur glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-aura-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sage-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-aura-100 text-aura-800 border border-aura-200 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-aura-700" />
            <span>Brand Philosophy & Story</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-aura-950 tracking-tight leading-tight">
            Pure Organic Skincare Crafted with Mindful Indian Botanicals
          </h2>

          <p className="mt-4 text-sm sm:text-base text-stone-600 leading-relaxed font-light">
            {BRAND_INFO.overview} We believe true radiance comes from formulations that respect your skin barrier, harnessing clinically proven botanical actives without harmful fillers or synthetic fragrances.
          </p>

          {/* Key Brand Pillars Grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-aura-200/60">
            <div className="p-4 rounded-2xl bg-white/80 border border-aura-200/60 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-sage-100 text-sage-800 flex items-center justify-center mb-3">
                <Leaf className="w-5 h-5 text-sage-700" />
              </div>
              <h3 className="font-semibold text-xs text-stone-900">100% Organic Extracts</h3>
              <p className="text-[11px] text-stone-500 mt-1">
                Kashmiri Saffron, Kakadu Plum & Organic Green Tea sourced ethically from local Indian growers.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 border border-aura-200/60 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-aura-100 text-aura-800 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5 text-aura-700" />
              </div>
              <h3 className="font-semibold text-xs text-stone-900">Clean & Toxin-Free</h3>
              <p className="text-[11px] text-stone-500 mt-1">
                Zero parabens, sulphates, artificial colorants, or mineral oils. Dermatologically tested.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 border border-aura-200/60 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                <Award className="w-5 h-5 text-amber-700" />
              </div>
              <h3 className="font-semibold text-xs text-stone-900">AI Voice Powered CX</h3>
              <p className="text-[11px] text-stone-500 mt-1">
                Meet Aria: our dedicated voice support specialist available in real-time right in your browser.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
