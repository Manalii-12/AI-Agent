import { prisma } from './db';

export async function seedDatabase() {
  console.log('🌱 Seeding Aura Skincare PostgreSQL database...');

  // 1. Seed Initial Assessment Orders
  const orders = [
    {
      id: 'ORD-101',
      customer: 'Priya Sharma',
      product: 'Vitamin C Serum (30ml)',
      value: 699,
      status: 'Out for Delivery',
      notes: 'BlueDart — BD-982103. Expected by 6 PM today',
      courier: 'BlueDart',
      trackingNumber: 'BD-982103',
      expectedDelivery: 'Today by 6:00 PM',
      deliveredDaysAgo: null,
      orderPlacedHoursAgo: null,
      paymentMethod: 'ONLINE',
    },
    {
      id: 'ORD-102',
      customer: 'Rahul Verma',
      product: 'Hydrating Sunscreen SPF 50',
      value: 499,
      status: 'Delivered',
      notes: 'Delhivery — DL-441029. Delivered 14 days ago',
      courier: 'Delhivery',
      trackingNumber: 'DL-441029',
      expectedDelivery: null,
      deliveredDaysAgo: 14,
      orderPlacedHoursAgo: null,
      paymentMethod: 'ONLINE',
    },
    {
      id: 'ORD-103',
      customer: 'Ananya Patel',
      product: 'Green Tea Face Wash + Toner',
      value: 850,
      status: 'Processing',
      notes: 'Ordered 3 hours ago. Eligible for cancellation',
      courier: null,
      trackingNumber: null,
      expectedDelivery: null,
      deliveredDaysAgo: null,
      orderPlacedHoursAgo: 3,
      paymentMethod: 'COD',
    },
  ];

  for (const order of orders) {
    await prisma.order.upsert({
      where: { id: order.id },
      update: order,
      create: order,
    });
  }

  // 2. Seed Products
  const products = [
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
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }

  // 3. Seed Users
  const users = [
    {
      id: 'user-101',
      name: 'Priya Sharma',
      email: 'priya@auraskincare.in',
      phone: '+91 98765 43210',
      sampleOrderId: 'ORD-101',
      isTestUser: true,
    },
    {
      id: 'user-102',
      name: 'Rahul Verma',
      email: 'rahul@auraskincare.in',
      phone: '+91 98111 22334',
      sampleOrderId: 'ORD-102',
      isTestUser: true,
    },
    {
      id: 'user-103',
      name: 'Ananya Patel',
      email: 'ananya@auraskincare.in',
      phone: '+91 99222 33445',
      sampleOrderId: 'ORD-103',
      isTestUser: true,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
  }

  console.log('✅ Seeding complete! Database ready with ORD-101, ORD-102, ORD-103 and products.');
}

if (require.main === module) {
  seedDatabase()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
