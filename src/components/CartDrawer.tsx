'use client';

import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, Truck, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
}) => {
  const {
    items,
    removeFromCart,
    updateQuantity,
    subtotal,
    shippingFee,
    total,
    amountNeededForFreeShipping,
    freeShippingThreshold,
    isCodEligible,
  } = useCart();

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-stone-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-aura-800" />
              <h3 className="font-serif font-bold text-base text-aura-950">Your Shopping Bag</h3>
              <span className="text-xs text-stone-500">({items.length} items)</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-stone-200/60 text-stone-500 hover:text-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Tracker Bar */}
          <div className="px-6 py-3 bg-aura-50/80 border-b border-aura-100 text-xs">
            <div className="flex items-center justify-between mb-1.5 text-[11px] font-medium">
              <span className="flex items-center gap-1.5 text-aura-900">
                <Truck className="w-3.5 h-3.5 text-aura-700" />
                {amountNeededForFreeShipping > 0 ? (
                  <span>
                    Add <strong className="font-bold text-aura-950">₹{amountNeededForFreeShipping}</strong> more for <strong>FREE Delivery</strong>
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold">
                    🎉 Congratulations! You have unlocked FREE Delivery!
                  </span>
                )}
              </span>
              <span className="text-stone-500">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-aura-600 to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 py-12">
                <ShoppingBag className="w-12 h-12 mb-3 opacity-30 text-stone-500" />
                <p className="text-sm font-semibold text-stone-700">Your bag is empty</p>
                <p className="text-xs text-stone-500 mt-1 max-w-xs">
                  Browse our organic skincare formulations above and add your favorite essentials.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-200/80 flex items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-xs text-stone-900 line-clamp-1">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      ₹{item.product.price} • {item.product.size}
                    </p>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-semibold text-stone-800 w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-serif font-bold text-xs text-stone-900">
                      ₹{item.product.price * item.quantity}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="mt-2 text-stone-400 hover:text-rose-600 transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-stone-200 bg-stone-50/50 space-y-3">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-800">₹{subtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Shipping Fee</span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    <span className="font-semibold text-stone-800">₹{shippingFee}</span>
                  )}
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-bold text-stone-900">
                  <span>Total Amount</span>
                  <span className="font-serif text-base text-aura-950">₹{total}</span>
                </div>
              </div>

              {/* COD Eligibility Note */}
              <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sage-600" />
                {isCodEligible ? (
                  <span>Eligible for Cash on Delivery (COD) / UPI at doorstep</span>
                ) : (
                  <span className="text-amber-700">Orders above ₹2,500 require online payment</span>
                )}
              </div>

              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 rounded-2xl bg-aura-800 hover:bg-aura-900 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
