import { Order } from '@/types';

// Mock Order Database according to DataStraw specification
export const INITIAL_ORDERS: Record<string, Order> = {
  'ORD-101': {
    orderId: 'ORD-101',
    customer: 'Priya Sharma',
    product: 'Vitamin C Serum',
    value: 699,
    status: 'Out for Delivery',
    notes: 'BlueDart — BD-982103. Expected by 6 PM today',
    courier: 'BlueDart',
    trackingNumber: 'BD-982103',
    expectedDelivery: 'Today by 6:00 PM',
  },
  'ORD-102': {
    orderId: 'ORD-102',
    customer: 'Rahul Verma',
    product: 'Hydrating Sunscreen SPF 50',
    value: 499,
    status: 'Delivered',
    notes: 'Delhivery — DL-441029. Delivered 14 days ago',
    courier: 'Delhivery',
    trackingNumber: 'DL-441029',
    deliveredDaysAgo: 14,
  },
  'ORD-103': {
    orderId: 'ORD-103',
    customer: 'Ananya Patel',
    product: 'Green Tea Face Wash + Toner',
    value: 850,
    status: 'Processing',
    notes: 'Ordered 3 hours ago. Eligible for cancellation',
    orderPlacedHoursAgo: 3,
  },
};

// In-memory store that can be reset or updated during session (e.g., cancelling an order or placing a new order)
let currentOrders: Record<string, Order> = { ...INITIAL_ORDERS };

export function getOrder(orderId: string): Order | null {
  const normalizedId = orderId.trim().toUpperCase();
  return currentOrders[normalizedId] || null;
}

export function getAllOrders(): Order[] {
  return Object.values(currentOrders);
}

export function getCustomerOrders(customerName: string): Order[] {
  if (!customerName) return [];
  const cleanName = customerName.toLowerCase().trim();
  const firstName = cleanName.split(' ')[0];

  return Object.values(currentOrders).filter((o) => {
    const oName = o.customer.toLowerCase().trim();
    const oFirstName = oName.split(' ')[0];
    return (
      oName === cleanName ||
      oName.includes(cleanName) ||
      cleanName.includes(oName) ||
      (firstName.length > 2 && oFirstName === firstName)
    );
  });
}

export function updateOrderStatus(orderId: string, status: Order['status'], newNote?: string): boolean {
  const normalizedId = orderId.trim().toUpperCase();
  if (currentOrders[normalizedId]) {
    currentOrders[normalizedId] = {
      ...currentOrders[normalizedId],
      status,
      notes: newNote ? `${newNote} (${currentOrders[normalizedId].notes})` : currentOrders[normalizedId].notes,
    };
    return true;
  }
  return false;
}

let orderCounter = 104;

export function createOrder(params: {
  customer: string;
  product: string;
  value: number;
  paymentMethod: 'COD' | 'ONLINE';
}): Order {
  const newId = `ORD-${orderCounter++}`;
  const newOrder: Order = {
    orderId: newId,
    customer: params.customer,
    product: params.product,
    value: params.value,
    status: 'Processing',
    notes: `Placed just now via ${params.paymentMethod}. Eligible for cancellation while Processing.`,
    orderPlacedHoursAgo: 0,
  };

  currentOrders[newId] = newOrder;
  return newOrder;
}

export function resetMockOrders(): void {
  currentOrders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
  orderCounter = 104;
}
