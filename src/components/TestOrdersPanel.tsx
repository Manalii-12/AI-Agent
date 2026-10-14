'use client';

import React, { useState } from 'react';
import { Package, Truck, Clock, CheckCircle2, AlertTriangle, ArrowRight, CornerDownRight, User, ShoppingBag, Sparkles } from 'lucide-react';
import { getAllOrders, getCustomerOrders } from '@/data/mockOrders';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types';

interface TestOrdersPanelProps {
  onSelectPrompt: (text: string) => void;
  isCallActive: boolean;
}

export const TestOrdersPanel: React.FC<TestOrdersPanelProps> = ({ onSelectPrompt, isCallActive }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'myOrders' | 'allScenarios'>('myOrders');

  const allOrders = getAllOrders();
  const userOrders = user ? getCustomerOrders(user.name) : [];

  const handleChipClick = (prompt: string) => {
    onSelectPrompt(prompt);
  };

  // Render a single order card
  const renderOrderCard = (order: Order) => {
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
        className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm hover:border-aura-400 hover:shadow-md transition-all flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono font-bold text-xs text-aura-900 bg-aura-50 px-2.5 py-1 rounded-lg border border-aura-200">
              {order.orderId}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
              {statusIcon}
              {order.status}
            </span>
          </div>

          <p className="font-semibold text-xs text-stone-900 line-clamp-1">{order.product}</p>
          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
            <span>Customer: <strong className="text-stone-800">{order.customer}</strong></span>
            <span className="font-serif font-bold text-stone-900">₹{order.value}</span>
          </div>

          <div className="mt-2.5 p-2 rounded-xl bg-stone-50 border border-stone-200/80 text-[10px] text-stone-600 leading-snug">
            <span className="font-semibold text-stone-800">Note:</span> {order.notes}
          </div>
        </div>

        {/* Quick Voice Prompt Chips */}
        <div className="mt-3.5 pt-2.5 border-t border-stone-100 flex flex-col gap-1.5">
          {order.orderId === 'ORD-101' && (
            <>
              <button
                onClick={() => handleChipClick("Where is my order ORD-101?")}
                className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-aura-100/60 text-aura-900 border border-stone-200 transition flex items-center justify-between group cursor-pointer"
              >
                <span className="truncate">&quot;Where is my order ORD-101?&quot;</span>
                <CornerDownRight className="w-3 h-3 text-aura-600 opacity-60 group-hover:opacity-100 ml-1 shrink-0" />
              </button>
              <button
                onClick={() => handleChipClick("Can I cancel ORD-101?")}
                className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-rose-50 text-rose-900 border border-stone-200 transition flex items-center justify-between group cursor-pointer"
                title="Tests Policy Enforcement: out for delivery cannot be cancelled"
              >
                <span className="truncate">&quot;Can I cancel ORD-101?&quot;</span>
                <CornerDownRight className="w-3 h-3 text-rose-600 opacity-60 group-hover:opacity-100 ml-1 shrink-0" />
              </button>
            </>
          )}

          {order.orderId === 'ORD-102' && (
            <button
              onClick={() => handleChipClick("Can I return order ORD-102? It has been 14 days.")}
              className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-amber-50 text-amber-900 border border-stone-200 transition flex items-center justify-between group cursor-pointer"
              title="Tests Policy Enforcement: delivered 14 days ago exceeds 7 day return window"
            >
              <span className="truncate">&quot;Can I return ORD-102?&quot;</span>
              <CornerDownRight className="w-3 h-3 text-amber-600 opacity-60 group-hover:opacity-100 ml-1 shrink-0" />
            </button>
          )}

          {order.orderId === 'ORD-103' && (
            <button
              onClick={() => handleChipClick("Please cancel my order ORD-103")}
              className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-emerald-50 text-emerald-900 border border-stone-200 transition flex items-center justify-between group cursor-pointer"
              title="Tests Tool Execution: cancels order because status is Processing"
            >
              <span className="truncate">&quot;Please cancel order ORD-103&quot;</span>
              <CornerDownRight className="w-3 h-3 text-emerald-600 opacity-60 group-hover:opacity-100 ml-1 shrink-0" />
            </button>
          )}

          {order.orderId !== 'ORD-101' && order.orderId !== 'ORD-102' && order.orderId !== 'ORD-103' && (
            <>
              <button
                onClick={() => handleChipClick(`Where is my order ${order.orderId}?`)}
                className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-aura-100/60 text-aura-900 border border-stone-200 transition flex items-center justify-between group cursor-pointer"
              >
                <span className="truncate">&quot;Where is my order {order.orderId}?&quot;</span>
                <CornerDownRight className="w-3 h-3 text-aura-600 opacity-60 group-hover:opacity-100 ml-1 shrink-0" />
              </button>
              <button
                onClick={() => handleChipClick(`Please cancel order ${order.orderId}`)}
                className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-amber-50 text-amber-900 border border-stone-200 transition flex items-center justify-between group cursor-pointer"
              >
                <span className="truncate">&quot;Cancel order {order.orderId}&quot;</span>
                <CornerDownRight className="w-3 h-3 text-amber-600 opacity-60 group-hover:opacity-100 ml-1 shrink-0" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/95 border border-aura-200/90 rounded-3xl p-6 shadow-xl shadow-aura-900/5 backdrop-blur-md">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-aura-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-aura-100 text-aura-800">
            <Package className="w-4 h-4 text-aura-700" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-sm text-aura-950">
              {user ? `${user.name}'s Active Orders` : 'Orders Helper'}
            </h2>
            <p className="text-[11px] text-stone-500">
              {activeTab === 'myOrders'
                ? `Showing active orders registered for ${user?.name || 'you'}`
                : 'All DataStraw sample orders & evaluation test scenarios'}
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1 rounded-xl bg-stone-100 border border-stone-200 text-xs">
          <button
            onClick={() => setActiveTab('myOrders')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'myOrders'
                ? 'bg-white text-aura-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            My Orders ({userOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('allScenarios')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'allScenarios'
                ? 'bg-white text-aura-950 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Test Scenarios ({allOrders.length})
          </button>
        </div>
      </div>

      {/* Orders Grid Display */}
      {activeTab === 'myOrders' ? (
        userOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {userOrders.map(renderOrderCard)}
          </div>
        ) : (
          <div className="text-center py-8 px-4 rounded-2xl bg-stone-50/80 border border-stone-200">
            <ShoppingBag className="w-10 h-10 text-stone-400 mx-auto mb-2 opacity-60" />
            <h3 className="font-semibold text-xs text-stone-800">No Orders Found for {user?.name}</h3>
            <p className="text-[11px] text-stone-500 max-w-sm mx-auto mt-1">
              You haven&apos;t placed an order yet! Add items from our organic skincare catalog above to place an order, or click &quot;All Test Scenarios&quot; to test with sample orders.
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {allOrders.map(renderOrderCard)}
        </div>
      )}

      {/* Guardrail and Policy Quick Test Bar */}
      <div className="mt-4 pt-3.5 border-t border-aura-100">
        <span className="text-[11px] font-semibold text-stone-600 block mb-2">
          Quick Guardrail & Policy Prompts (Click to ask Aria):
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleChipClick("Mera ORD-101 abhi tak aaya nahi, kab tak aayega?")}
            className="text-[10px] px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition cursor-pointer font-medium"
            title="Native Hinglish Tracking test"
          >
            🇮🇳 &quot;Mera ORD-101 kab tak aayega?&quot;
          </button>
          <button
            onClick={() => handleChipClick("Add the SPF 50 Sunscreen to my cart")}
            className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition cursor-pointer font-medium"
            title="Voice Cart management test"
          >
            🛍️ &quot;Add the SPF 50 Sunscreen to my cart&quot;
          </button>
          <button
            onClick={() => handleChipClick("What's in my bag right now?")}
            className="text-[10px] px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 transition cursor-pointer font-medium"
          >
            👜 &quot;What&apos;s in my bag right now?&quot;
          </button>
          <button
            onClick={() => handleChipClick("Reorder my sunscreen")}
            className="text-[10px] px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 transition cursor-pointer font-medium"
          >
            🔄 &quot;Reorder my sunscreen&quot;
          </button>
          <button
            onClick={() => handleChipClick("What is your return policy for opened items?")}
            className="text-[10px] px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
          >
            🛡️ Opened product return policy
          </button>
          <button
            onClick={() => handleChipClick("Can you book me a flight to Goa?")}
            className="text-[10px] px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
          >
            ✈️ Flight to Goa (Out-of-scope)
          </button>
          <button
            onClick={() => handleChipClick("Where is order ORD-999?")}
            className="text-[10px] px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
          >
            ❓ Invalid ORD-999 (Graceful degradation)
          </button>
          <button
            onClick={() => handleChipClick("Do you offer Cash on Delivery?")}
            className="text-[10px] px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
          >
            💵 Cash on Delivery limit
          </button>
        </div>
      </div>
    </div>
  );
};
