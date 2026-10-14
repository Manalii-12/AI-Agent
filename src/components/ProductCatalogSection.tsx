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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map((prod) => {
          const isAdded = addedId === prod.id;
          return (
            <div
              key={prod.id}
              className="rounded-3xl bg-white border border-stone-200/90 overflow-hidden shadow-md hover:shadow-xl hover:border-aura-400 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Real Product Photography */}
                <div className="w-full h-52 relative overflow-hidden bg-stone-100">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                  {prod.badge && (
                    <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/95 text-stone-900 shadow-sm backdrop-blur-xs">
                      {prod.badge}
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-md bg-stone-900/80 text-white backdrop-blur-xs">
                    {prod.size}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-sage-800 bg-sage-50 border border-sage-200 px-2.5 py-0.5 rounded-full">
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

                  {/* Key Ingredients */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {prod.keyIngredients.slice(0, 3).map((ing, i) => (
                      <span
                        key={i}
                        className="text-[9px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium border border-stone-200/60"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price & Add to Cart button */}
              <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between bg-stone-50/40">
                <div>
                  <span className="text-[10px] text-stone-400 block font-medium">Price</span>
                  <span className="font-serif font-bold text-base text-stone-900">
                    ₹{prod.price}
                  </span>
                </div>

                <button
                  onClick={() => handleAdd(prod)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition active:scale-95 cursor-pointer ${
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
                      <span>Add to Bag</span>
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
