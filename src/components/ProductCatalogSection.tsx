'use client';

import React, { useState } from 'react';
import { ShoppingBag, Star, Sparkles, Check } from 'lucide-react';
import { PRODUCTS, Product } from '@/data/products';
import { useCart } from '@/context/CartContext';

interface ProductCatalogSectionProps {
  onOpenCart: () => void;
}

export const ProductCatalogSection: React.FC<ProductCatalogSectionProps> = ({ onOpenCart }) => {
  const { addToCart } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleAdd = (product: Product) => {
    addToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <section id="products-section" className="scroll-mt-24 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sage-600" />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-aura-950">
              Organic Skincare Formulations
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500">
            Hand-crafted small batch skincare formulated with clean, active botanical ingredients.
          </p>
        </div>
        <button
          onClick={onOpenCart}
          className="text-xs font-semibold text-aura-800 hover:text-aura-950 flex items-center gap-1.5 underline underline-offset-4"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>View Cart & Free Shipping Goal &rarr;</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PRODUCTS.map((prod) => {
          const isAdded = addedId === prod.id;
          return (
            <div
              key={prod.id}
              className="rounded-3xl bg-white/90 border border-aura-200/80 p-5 shadow-lg shadow-aura-900/5 backdrop-blur-md flex flex-col justify-between hover:shadow-xl hover:border-aura-300 transition group"
            >
              <div>
                {/* Visual Header / Avatar Banner */}
                <div
                  className={`w-full h-36 rounded-2xl bg-gradient-to-tr ${prod.imageColor} flex items-center justify-center relative overflow-hidden shadow-inner mb-4`}
                >
                  <Sparkles className="w-12 h-12 text-white/50 group-hover:scale-110 transition duration-300" />
                  {prod.badge && (
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/90 text-stone-900 shadow-xs backdrop-blur-xs">
                      {prod.badge}
                    </span>
                  )}
                  <span className="absolute bottom-2.5 right-2.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-stone-900/60 text-white backdrop-blur-xs">
                    {prod.size}
                  </span>
                </div>

                {/* Title & Category */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-sage-700 bg-sage-50 px-2 py-0.5 rounded-full">
                    {prod.category}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{prod.rating}</span>
                    <span className="text-stone-400 font-normal">({prod.reviewsCount})</span>
                  </div>
                </div>

                <h3 className="font-serif font-bold text-sm text-stone-900 line-clamp-1 group-hover:text-aura-800 transition">
                  {prod.name}
                </h3>
                <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                  {prod.description}
                </p>

                {/* Key Ingredients tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {prod.keyIngredients.slice(0, 3).map((ing, i) => (
                    <span
                      key={i}
                      className="text-[9px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price & Add to Cart button */}
              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 block">Price</span>
                  <span className="font-serif font-bold text-base text-stone-900">
                    ₹{prod.price}
                  </span>
                </div>

                <button
                  onClick={() => handleAdd(prod)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition active:scale-95 ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-aura-800 hover:bg-aura-900 text-white'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
