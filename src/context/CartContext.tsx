'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/data/products';
import { Order } from '@/types';
import { createOrder } from '@/data/mockOrders';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  shippingFee: number;
  total: number;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  isCodEligible: boolean;
  placeOrder: (customerName: string, paymentMethod: 'COD' | 'ONLINE') => Order;
  lastPlacedOrder: Order | null;
  setLastPlacedOrder: (order: Order | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  const FREE_SHIPPING_THRESHOLD = 499;
  const STANDARD_SHIPPING_FEE = 50;
  const COD_MAX_LIMIT = 2500;

  // Load cart from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('aura_cart');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const saveCart = (newItems: CartItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem('aura_cart', JSON.stringify(newItems));
    } catch (e) {}
  };

  const addToCart = (product: Product) => {
    const existingIndex = items.findIndex((i) => i.product.id === product.id);
    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...items];
      updated[existingIndex].quantity += 1;
    } else {
      updated = [...items, { product, quantity: 1 }];
    }
    saveCart(updated);
  };

  const removeFromCart = (productId: string) => {
    const updated = items.filter((i) => i.product.id !== productId);
    saveCart(updated);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updated = items.map((i) => (i.product.id === productId ? { ...i, quantity } : i));
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const subtotal = items.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING_FEE;
  const total = subtotal + shippingFee;
  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const isCodEligible = total <= COD_MAX_LIMIT;

  const placeOrder = (customerName: string, paymentMethod: 'COD' | 'ONLINE'): Order => {
    const productSummary = items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ');
    const newOrder = createOrder({
      customer: customerName || 'Valued Customer',
      product: productSummary || 'Organic Skincare Pack',
      value: total,
      paymentMethod,
    });

    clearCart();
    setLastPlacedOrder(newOrder);
    return newOrder;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        shippingFee,
        total,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        amountNeededForFreeShipping,
        isCodEligible,
        placeOrder,
        lastPlacedOrder,
        setLastPlacedOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
