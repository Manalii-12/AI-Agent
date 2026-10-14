import { getOrder, updateOrderStatus, getAllOrders } from '@/data/mockOrders';

export interface ToolResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Standardize order ID extraction from voice input (handles "ord 101", "order 101", "102", "o r d 102", "ORD-102", etc.)
 */
export function normalizeOrderId(rawInput: string): string {
  if (!rawInput) return '';
  const cleaned = rawInput.toLowerCase().trim();

  // Pattern 1: Explicit ORD-101, ord 102, ord103, order 101, o r d 102, od 102, etc.
  const matchExplicit = cleaned.match(/(?:ord|order|o\s*r\s*d|od|ward|audi|audit)[-\s]*([0-9]{3})/i);
  if (matchExplicit) {
    return `ORD-${matchExplicit[1]}`;
  }

  // Pattern 2: Standalone sample number like 101, 102, 103, 999
  const matchNum = cleaned.match(/\b(10[1-9]|999)\b/);
  if (matchNum) {
    return `ORD-${matchNum[1]}`;
  }

  // Pattern 3: Generic ORD-XXX
  const genericMatch = cleaned.match(/ord[-\s]?([0-9]+)/i);
  if (genericMatch) {
    return `ORD-${genericMatch[1]}`;
  }

  return rawInput.trim().toUpperCase();
}

/**
 * Required tool: get_order_details(order_id)
 */
export function get_order_details(order_id: string): ToolResult {
  const normalizedId = normalizeOrderId(order_id);
  
  if (!normalizedId) {
    return {
      success: false,
      message: "I didn't catch the order number. Could you please provide your Order ID (like ORD-101)?",
    };
  }

  const order = getOrder(normalizedId);

  if (!order) {
    return {
      success: false,
      message: `I couldn't locate an order with number ${normalizedId}. Could you please repeat or verify the ID?`,
      data: { searchedId: normalizedId, availableSampleOrders: ['ORD-101', 'ORD-102', 'ORD-103'] },
    };
  }

  let statusDescription = `Order ${order.orderId} for ${order.customer} (${order.product}, value ₹${order.value}) is currently ${order.status}.`;
  
  if (order.status === 'Out for Delivery') {
    statusDescription += ` It is out for delivery via ${order.courier} (Tracking: ${order.trackingNumber}) and expected today by 6:00 PM.`;
  } else if (order.status === 'Delivered') {
    statusDescription += ` It was delivered ${order.deliveredDaysAgo} days ago via ${order.courier} (Tracking: ${order.trackingNumber}).`;
  } else if (order.status === 'Processing') {
    statusDescription += ` It was placed ${order.orderPlacedHoursAgo} hours ago and is currently being processed.`;
  } else if (order.status === 'Cancelled') {
    statusDescription += ` This order has been cancelled.`;
  }

  return {
    success: true,
    message: statusDescription,
    data: order,
  };
}

/**
 * Tool: cancel_order(order_id)
 * Follows brand policy: Only 'Processing' orders can be cancelled.
 */
export function cancel_order(order_id: string): ToolResult {
  const normalizedId = normalizeOrderId(order_id);
  const order = getOrder(normalizedId);

  if (!order) {
    return {
      success: false,
      message: `I couldn't locate order ${normalizedId} to cancel. Please check the order number.`,
    };
  }

  if (order.status === 'Processing') {
    updateOrderStatus(normalizedId, 'Cancelled', 'Cancelled per customer voice request');
    return {
      success: true,
      message: `Your order ${normalizedId} has been successfully cancelled. Since it was in Processing status, no charges will apply.`,
      data: getOrder(normalizedId),
    };
  }

  if (order.status === 'Out for Delivery' || order.status === 'Shipped') {
    return {
      success: false,
      message: `Per Aura Skincare policy, orders cannot be cancelled once they are ${order.status}. However, you can refuse the package at the doorstep when delivery is attempted.`,
      data: order,
    };
  }

  if (order.status === 'Delivered') {
    return {
      success: false,
      message: `Order ${normalizedId} has already been delivered. Cancellation is not possible, but you may request a return within 7 days if the product is unopened.`,
      data: order,
    };
  }

  return {
    success: false,
    message: `Order ${normalizedId} is already ${order.status}.`,
    data: order,
  };
}

/**
 * Tool: check_return_eligibility(order_id, is_opened, days_since_delivery)
 * Follows brand policy: returns within 7 days for unopened products only. Damaged within 48h.
 */
export function check_return_eligibility(order_id: string, is_opened: boolean = false, is_damaged: boolean = false): ToolResult {
  const normalizedId = normalizeOrderId(order_id);
  const order = getOrder(normalizedId);

  if (!order) {
    return {
      success: false,
      message: `I couldn't locate order ${normalizedId}. Please verify your order ID.`,
    };
  }

  if (order.status !== 'Delivered') {
    return {
      success: false,
      message: `Order ${normalizedId} is currently ${order.status}. Returns can only be requested after an item has been delivered.`,
      data: order,
    };
  }

  const daysAgo = order.deliveredDaysAgo || 0;

  if (is_damaged) {
    if (daysAgo <= 2) {
      return {
        success: true,
        message: `I am so sorry to hear the product arrived damaged. Since it was delivered within 48 hours, please share photos with our support team at support@auraskincare.in, and we will dispatch a free replacement immediately.`,
      };
    } else {
      return {
        success: false,
        message: `Damaged or defective items must be reported within 48 hours of delivery. Since your order was delivered ${daysAgo} days ago, we cannot process a damaged product replacement.`,
      };
    }
  }

  if (is_opened) {
    return {
      success: false,
      message: `Per our return policy, returns are only accepted for unopened, unused products in original packaging. Because the item has been opened, we cannot accept a return.`,
    };
  }

  if (daysAgo > 7) {
    return {
      success: false,
      message: `Our return window is strictly within 7 days of delivery. As order ${normalizedId} was delivered ${daysAgo} days ago, it is unfortunately no longer eligible for return.`,
    };
  }

  return {
    success: true,
    message: `Order ${normalizedId} is within the 7-day return window. Since the product is unopened in original packaging, you are eligible for a return. Would you like me to initiate the pickup process?`,
    data: order,
  };
}

export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_order_details',
      description: 'Retrieve real-time order status, tracking number, courier, items, and delivery date for a customer order.',
      parameters: {
        type: 'object',
        properties: {
          order_id: {
            type: 'string',
            description: 'The unique order ID, e.g. ORD-101, ORD-102, ORD-103',
          },
        },
        required: ['order_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_order',
      description: 'Cancel an order if eligible according to Aura Skincare policy (only orders with status Processing can be cancelled).',
      parameters: {
        type: 'object',
        properties: {
          order_id: {
            type: 'string',
            description: 'The order ID to cancel, e.g. ORD-103',
          },
        },
        required: ['order_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_return_eligibility',
      description: 'Check if an order can be returned or refunded according to policy (within 7 days, unopened, or damaged within 48 hours).',
      parameters: {
        type: 'object',
        properties: {
          order_id: {
            type: 'string',
            description: 'The order ID, e.g. ORD-102',
          },
          is_opened: {
            type: 'boolean',
            description: 'Whether the product has been opened or unsealed by the customer',
          },
          is_damaged: {
            type: 'boolean',
            description: 'Whether the product was received in a damaged or defective condition',
          },
        },
        required: ['order_id'],
      },
    },
  },
];
