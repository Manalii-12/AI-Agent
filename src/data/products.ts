export interface Product {
  id: string;
  name: string;
  category: 'Serums' | 'Sunscreen' | 'Cleansers' | 'Creams' | 'Toners';
  price: number; // in INR
  size: string;
  description: string;
  keyIngredients: string[];
  rating: number;
  reviewsCount: number;
  badge?: string;
  stock: number;
  image: string;
  imageColor: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 'PROD-001',
    name: 'Vitamin C Brightening Serum',
    category: 'Serums',
    price: 699,
    size: '30ml',
    description: 'Potent 15% Ethyl Ascorbic Acid combined with Ferulic acid & Kakadu Plum for luminous, even-toned skin.',
    keyIngredients: ['15% Vitamin C', 'Ferulic Acid', 'Kakadu Plum', 'Hyaluronic Acid'],
    rating: 4.8,
    reviewsCount: 342,
    badge: 'Bestseller',
    stock: 45,
    image: '/images/products/serum.jpg',
    imageColor: 'from-amber-200 to-orange-300',
  },
  {
    id: 'PROD-002',
    name: 'Hydrating Sunscreen SPF 50 PA++++',
    category: 'Sunscreen',
    price: 499,
    size: '50g',
    description: 'Ultra-lightweight, zero white-cast sunscreen enriched with Cica & Ceramide complex for broad-spectrum UV protection.',
    keyIngredients: ['Centella Asiatica (Cica)', 'Ceramides', 'Niacinamide'],
    rating: 4.9,
    reviewsCount: 512,
    badge: 'Award Winner',
    stock: 60,
    image: '/images/products/sunscreen.jpg',
    imageColor: 'from-sky-200 to-blue-300',
  },
  {
    id: 'PROD-003',
    name: 'Green Tea Clarifying Face Wash + Toner',
    category: 'Cleansers',
    price: 850,
    size: '150ml + 100ml',
    description: 'Gentle pH-balanced foaming face wash paired with pore-tightening green tea antioxidant mist.',
    keyIngredients: ['Organic Green Tea', 'Salicylic Acid 0.5%', 'Tea Tree Oil', 'Aloe Vera'],
    rating: 4.7,
    reviewsCount: 289,
    badge: 'Dual Kit',
    stock: 35,
    image: '/images/products/facewash.jpg',
    imageColor: 'from-emerald-200 to-teal-300',
  },
  {
    id: 'PROD-004',
    name: 'Kumkumadi Radiance Night Cream',
    category: 'Creams',
    price: 1199,
    size: '50g',
    description: 'Authentic 24K Gold Bhasma & Kashmiri Saffron infused night treatment that deeply rejuvenates overnight.',
    keyIngredients: ['Kashmiri Saffron', '24K Gold Bhasma', 'Sandalwood Oil', 'Lotus Pollen'],
    rating: 4.9,
    reviewsCount: 198,
    badge: 'Luxury Ayurvedic',
    stock: 20,
    image: '/images/products/nightcream.jpg',
    imageColor: 'from-rose-200 to-amber-300',
  },
  {
    id: 'PROD-005',
    name: 'Pure Kannauj Rose Water Mist',
    category: 'Toners',
    price: 399,
    size: '100ml',
    description: 'Steam-distilled pure organic Kannauj Damask rose water. Balances pH, hydrates, and refreshes tired skin.',
    keyIngredients: ['100% Steam-Distilled Kannauj Rose Water'],
    rating: 4.8,
    reviewsCount: 420,
    badge: '100% Organic',
    stock: 80,
    image: '/images/products/rosemist.jpg',
    imageColor: 'from-pink-200 to-rose-300',
  },
];

export function findProductByVoice(spokenText: string): Product | null {
  const query = spokenText.toLowerCase();

  if (query.includes('sunscreen') || query.includes('spf') || query.includes('sun screen')) {
    return PRODUCTS.find((p) => p.id === 'PROD-002') || null;
  }
  if (query.includes('serum') || query.includes('vitamin c') || query.includes('vit c')) {
    return PRODUCTS.find((p) => p.id === 'PROD-001') || null;
  }
  if (query.includes('face wash') || query.includes('facewash') || query.includes('green tea') || query.includes('cleanser')) {
    return PRODUCTS.find((p) => p.id === 'PROD-003') || null;
  }
  if (query.includes('night cream') || query.includes('kumkumadi') || query.includes('cream')) {
    return PRODUCTS.find((p) => p.id === 'PROD-004') || null;
  }
  if (query.includes('rose') || query.includes('mist') || query.includes('gulab') || query.includes('kannauj')) {
    return PRODUCTS.find((p) => p.id === 'PROD-005') || null;
  }

  return null;
}
