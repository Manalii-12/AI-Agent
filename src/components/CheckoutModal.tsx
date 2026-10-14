'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Truck, Banknote, CreditCard, Sparkles, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { items, total, shippingFee, placeOrder, isCodEligible } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [address, setAddress] = useState('124, Lotus Boulevard, Indiranagar');
  const [city, setCity] = useState('Bengaluru');
  const [pincode, setPincode] = useState('560038');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customerName.trim() || user?.name || 'Customer';
    const order = placeOrder(finalName, paymentMethod);
    setPlacedOrder(order);
    onOrderSuccess(order);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base text-aura-950">
                {placedOrder ? 'Order Confirmed!' : 'Express Checkout'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {placedOrder ? 'Your order is recorded in live mock database' : 'Fast, secure checkout for Aura Skincare'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-200/60 text-stone-500 hover:text-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {placedOrder ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Thank You, {placedOrder.customer}!
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Your order has been placed and is currently in <strong>Processing</strong> status.
                </p>
              </div>

              {/* Order Details Card */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                  <span className="text-stone-500">Order ID:</span>
                  <span className="font-mono font-bold text-aura-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                    {placedOrder.orderId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Items:</span>
                  <span className="font-medium text-stone-800 text-right truncate max-w-[200px]">
                    {placedOrder.product}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Total Value:</span>
                  <span className="font-bold text-stone-900">₹{placedOrder.value}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {placedOrder.status} (Eligible for cancellation)
                  </span>
                </div>
              </div>

              {/* Talk to Aria prompt */}
              <div className="p-3.5 rounded-2xl bg-aura-50 border border-aura-200 text-xs text-aura-900">
                <p className="font-semibold flex items-center justify-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-aura-700" />
                  <span>Test with Voice Agent Aria!</span>
                </p>
                <p className="text-[11px] text-aura-800">
                  Ask Aria: <em>&quot;Where is my order {placedOrder.orderId}?&quot;</em> or <em>&quot;Please cancel order {placedOrder.orderId}&quot;</em>
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs transition"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => {
                    onClose();
                    const el = document.getElementById('voice-agent-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex-1 py-3 rounded-xl bg-aura-800 hover:bg-aura-900 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <span>Talk to Aria</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-aura-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Shipping Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-aura-400 focus:outline-none mb-2"
                  placeholder="Street / Flat address"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                    placeholder="Pincode"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!isCodEligible}
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                      paymentMethod === 'COD'
                        ? 'border-aura-700 bg-aura-50 text-aura-900 font-semibold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    } ${!isCodEligible ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Banknote className="w-4 h-4 text-aura-700" />
                      <span className="font-semibold text-xs">Cash on Delivery</span>
                    </div>
                    <span className="text-[10px] text-stone-500">Pay cash/UPI at doorstep</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ONLINE')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                      paymentMethod === 'ONLINE'
                        ? 'border-aura-700 bg-aura-50 text-aura-900 font-semibold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <CreditCard className="w-4 h-4 text-aura-700" />
                      <span className="font-semibold text-xs">UPI / Card / NetBanking</span>
                    </div>
                    <span className="text-[10px] text-stone-500">Instant instant online checkout</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 block">Total Due:</span>
                  <span className="font-serif font-bold text-base text-aura-950">₹{total}</span>
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-aura-800 hover:bg-aura-900 text-white font-semibold text-xs shadow-md transition"
                >
                  Place Order Now
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
