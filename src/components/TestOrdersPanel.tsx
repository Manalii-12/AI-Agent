'use client';

import React from 'react';
import { Package, Truck, Clock, CheckCircle2, AlertTriangle, ArrowRight, CornerDownRight } from 'lucide-react';
import { getAllOrders } from '@/data/mockOrders';

interface TestOrdersPanelProps {
  onSelectPrompt: (text: string) => void;
  isCallActive: boolean;
}

export const TestOrdersPanel: React.FC<TestOrdersPanelProps> = ({ onSelectPrompt, isCallActive }) => {
  const orders = getAllOrders();

  const handleChipClick = (prompt: string) => {
    onSelectPrompt(prompt);
  };

  return (
    <div className="bg-white/90 border border-aura-200/80 rounded-3xl p-5 shadow-lg shadow-aura-900/5 backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-aura-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-aura-100 text-aura-800">
            <Package className="w-4 h-4 text-aura-700" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-aura-900">Test Orders Helper Card</h2>
            <p className="text-[11px] text-aura-600">Sample order IDs & scenarios for instant evaluation</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-aura-50 text-aura-700 border border-aura-200">
          Section 2.E Spec
        </span>
      </div>

      {/* Orders List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {orders.map((order) => {
          let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
          let statusIcon = <Truck className="w-3.5 h-3.5 text-blue-600" />;

          if (order.status === 'Delivered') {
            badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
          } else if (order.status === 'Processing') {
            badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
            statusIcon = <Clock className="w-3.5 h-3.5 text-amber-600" />;
          } else if (order.status === 'Cancelled') {
            badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
            statusIcon = <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
          }

          return (
            <div
              key={order.orderId}
              className="p-3 rounded-2xl bg-stone-50/70 border border-stone-200/80 hover:border-aura-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs text-aura-900 bg-white px-2 py-0.5 rounded border border-stone-200 shadow-2xs">
                    {order.orderId}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${badgeColor}`}>
                    {statusIcon}
                    {order.status}
                  </span>
                </div>

                <p className="font-semibold text-xs text-stone-800 line-clamp-1">{order.product}</p>
                <div className="flex items-center justify-between text-[11px] text-stone-500 mt-0.5">
                  <span>Customer: {order.customer}</span>
                  <span className="font-medium text-stone-700">₹{order.value}</span>
                </div>

                <div className="mt-2 p-1.5 rounded-lg bg-white/80 border border-stone-200/60 text-[10px] text-stone-600 leading-snug">
                  <span className="font-medium text-stone-700">Note:</span> {order.notes}
                </div>
              </div>

              {/* Quick Action Suggestion Chips */}
              <div className="mt-3 pt-2 border-t border-stone-200/60 flex flex-col gap-1.5">
                {order.orderId === 'ORD-101' && (
                  <>
                    <button
                      onClick={() => handleChipClick("Where is my order ORD-101?")}
                      className="text-left text-[11px] px-2 py-1 rounded bg-white hover:bg-aura-100/60 text-aura-900 border border-stone-200 transition flex items-center justify-between group"
                    >
                      <span className="truncate">"Where is my order ORD-101?"</span>
                      <CornerDownRight className="w-3 h-3 text-aura-500 opacity-60 group-hover:opacity-100 ml-1 shrink-0" />
                    </button>
                    <button
                      onClick={() => handleChipClick("Can I cancel ORD-101?")}
                      className="text-left text-[11px] px-2 py-1 rounded bg-white hover:bg-rose-50 text-rose-900 border border-stone-200 transition flex items-center justify-between group"
                      title="Tests Policy Enforcement: out for delivery cannot be cancelled"
                    >
                      <span className="truncate">"Can I cancel ORD-101?"</span>
                      <CornerDownRight className="w-3 h-3 text-rose-500 opacity-60 group-hover:opacity-100 ml-1 shrink-0" />
                    </button>
                  </>
                )}

                {order.orderId === 'ORD-102' && (
                  <button
                    onClick={() => handleChipClick("Can I return order ORD-102? It has been 14 days.")}
                    className="text-left text-[11px] px-2 py-1 rounded bg-white hover:bg-amber-50 text-amber-900 border border-stone-200 transition flex items-center justify-between group"
                    title="Tests Policy Enforcement: delivered 14 days ago exceeds 7 day return window"
                  >
                    <span className="truncate">"Can I return ORD-102?"</span>
                    <CornerDownRight className="w-3 h-3 text-amber-500 opacity-60 group-hover:opacity-100 ml-1 shrink-0" />
                  </button>
                )}

                {order.orderId === 'ORD-103' && (
                  <button
                    onClick={() => handleChipClick("Please cancel my order ORD-103")}
                    className="text-left text-[11px] px-2 py-1 rounded bg-white hover:bg-emerald-50 text-emerald-900 border border-stone-200 transition flex items-center justify-between group"
                    title="Tests Tool Execution: cancels order because status is Processing"
                  >
                    <span className="truncate">"Please cancel order ORD-103"</span>
                    <CornerDownRight className="w-3 h-3 text-emerald-500 opacity-60 group-hover:opacity-100 ml-1 shrink-0" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edge Cases & Guardrails Quick Test Bar */}
      <div className="mt-3 pt-3 border-t border-aura-100">
        <span className="text-[11px] font-medium text-stone-600 block mb-1.5">
          Quick Guardrail & Edge Case Tests:
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleChipClick("What is your return policy for opened items?")}
            className="text-[10px] px-2 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
          >
            🛡️ Opened product return policy
          </button>
          <button
            onClick={() => handleChipClick("Can you book me a flight to Goa?")}
            className="text-[10px] px-2 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
          >
            ✈️ Flight to Goa (Out-of-scope)
          </button>
          <button
            onClick={() => handleChipClick("Where is order ORD-999?")}
            className="text-[10px] px-2 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
          >
            ❓ Invalid ORD-999 (Graceful degradation)
          </button>
          <button
            onClick={() => handleChipClick("Do you offer Cash on Delivery?")}
            className="text-[10px] px-2 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
          >
            💵 Cash on Delivery limit
          </button>
        </div>
      </div>
    </div>
  );
};
