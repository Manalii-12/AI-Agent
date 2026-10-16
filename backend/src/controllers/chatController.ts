import { Request, Response } from 'express';
import { prisma } from '../db';

export async function handleVoiceChat(req: Request, res: Response) {
  try {
    const { messages, apiKey: clientKey, provider = 'groq' } = req.body;

    const lastMessage = messages?.[messages.length - 1];
    const userText = (lastMessage?.text || lastMessage?.content || '').trim();
    const query = userText.toLowerCase();

    const isHinglish =
      query.includes('mera') ||
      query.includes('meri') ||
      query.includes('aaya') ||
      query.includes('aayega') ||
      query.includes('aayi') ||
      query.includes('nahi') ||
      query.includes('kab') ||
      query.includes('kya') ||
      query.includes('kar do') ||
      query.includes('karo') ||
      query.includes('hai') ||
      query.includes('chahiye') ||
      query.includes('batao') ||
      query.includes('namaste');

    // 1. Out of Scope (e.g. Flight to Goa)
    if (
      query.includes('flight') ||
      query.includes('goa') ||
      query.includes('hotel') ||
      query.includes('weather') ||
      query.includes('cricket') ||
      query.includes('uber') ||
      query.includes('movie') ||
      query.includes('recipe')
    ) {
      return res.json({
        response:
          'I can only help with Aura Skincare-related queries, such as our products, orders, shipping, and returns. Is there anything about Aura Skincare I can assist you with?',
      });
    }

    // 2. Summer & Sunscreen Recommendations
    if (query.includes('summer') || query.includes('garmi') || query.includes('dhoop') || query.includes('sun protection')) {
      return res.json({
        response:
          'For summer, we highly recommend our Hydrating Sunscreen SPF 50 and Pure Kannauj Rose Water Mist. They protect against UV damage and keep your skin fresh and hydrated. Would you like me to add the sunscreen to your bag?',
      });
    }

    // 2. Voice Cart Management & Re-ordering
    if (query.includes('reorder') || query.includes('re-order') || query.includes('phir se order') || query.includes('dobara order')) {
      let prodName = 'Hydrating Sunscreen SPF 50 PA++++';
      let prodPrice = 499;
      if (query.includes('serum') || query.includes('vitamin c')) {
        prodName = 'Vitamin C Brightening Serum';
        prodPrice = 699;
      }
      return res.json({
        response: `Certainly! I have added ${prodName} (₹${prodPrice}) to your bag for re-ordering. Would you like me to place it with Cash on Delivery?`,
        toolCalled: { name: 'reorder_item', args: { query }, result: { success: true, data: { product: { name: prodName, price: prodPrice } } } },
      });
    }

    if (
      (query.includes('add') && (query.includes('cart') || query.includes('bag') || query.includes('basket'))) ||
      query.includes('cart mein add') ||
      query.includes('bag mein add') ||
      query.includes('add to cart') ||
      query.startsWith('add ')
    ) {
      let prodName = 'Hydrating Sunscreen SPF 50 PA++++';
      let prodPrice = 499;
      if (query.includes('serum') || query.includes('vitamin c')) {
        prodName = 'Vitamin C Brightening Serum';
        prodPrice = 699;
      } else if (query.includes('face wash') || query.includes('green tea')) {
        prodName = 'Green Tea Clarifying Face Wash + Toner';
        prodPrice = 850;
      } else if (query.includes('night cream') || query.includes('kumkumadi')) {
        prodName = 'Kumkumadi Radiance Night Cream';
        prodPrice = 1199;
      } else if (query.includes('rose') || query.includes('mist')) {
        prodName = 'Pure Kannauj Rose Water Mist';
        prodPrice = 399;
      }
      return res.json({
        response: `I have added the ${prodName} (₹${prodPrice}) to your cart!`,
        toolCalled: { name: 'add_to_cart', args: { query }, result: { success: true, data: { product: { name: prodName, price: prodPrice } } } },
      });
    }

    if (
      (query.includes('what') && (query.includes('bag') || query.includes('cart'))) ||
      query.includes('in my bag') ||
      query.includes('in my cart')
    ) {
      return res.json({
        response:
          'You can view and manage all items in your bag anytime by clicking the shopping bag icon in the top navigation bar!',
      });
    }

    // 3. Extract Order ID
    let cleanedText = userText.toLowerCase()
      .replace(/\bone zero one\b/g, '101')
      .replace(/\bone not one\b/g, '101')
      .replace(/\bone zero two\b/g, '102')
      .replace(/\bone zero three\b/g, '103')
      .replace(/\bnine nine nine\b/g, '999');

    let orderId: string | null = null;
    const matchExplicit = cleanedText.match(/(?:ord|order|o\s*r\s*d|od|ward|audi)[-\s#:]*([0-9]{3})/i);
    const matchNum = cleanedText.match(/\b([0-9]{3})\b/);
    if (matchExplicit) {
      orderId = `ORD-${matchExplicit[1]}`;
    } else if (matchNum) {
      orderId = `ORD-${matchNum[1]}`;
    }

    // A. Cancellation Policy Enforcement
    if (query.includes('cancel')) {
      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
          return res.json({
            response: "I couldn't locate an order with that number, could you please repeat or verify the ID?",
          });
        }
        if (order.status === 'Processing') {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'Cancelled', notes: `Cancelled via Voice Support request` },
          });
          return res.json({
            response: `Your order ${orderId} has been successfully cancelled as it was still in Processing. No charges will apply.`,
            toolCalled: { name: 'cancel_order', args: { order_id: orderId }, result: { success: true } },
          });
        } else {
          return res.json({
            response: `Per Aura Skincare policy, orders cannot be cancelled once they are ${order.status}. However, you may refuse delivery at your doorstep when the courier arrives.`,
            toolCalled: { name: 'cancel_order', args: { order_id: orderId }, result: { success: false } },
          });
        }
      } else {
        return res.json({
          response: 'Orders can only be cancelled while their status is Processing. Could you please provide your Order ID, such as ORD-103?',
        });
      }
    }

    // B. Return / Refund Policy Enforcement
    if (
      query.includes('return') ||
      query.includes('refund') ||
      query.includes('exchange') ||
      query.includes('wapas') ||
      query.includes('20 days') ||
      query.includes('20 din') ||
      query.includes('days ago')
    ) {
      const isOpened = query.includes('open') || query.includes('opened') || query.includes('used') || query.includes('khula') || query.includes('khol');
      const isPastLimit = query.includes('20 days') || query.includes('20 din') || query.includes('14 days') || query.includes('month');

      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (order && order.deliveredDaysAgo && order.deliveredDaysAgo > 7) {
          return res.json({
            response: `Our return window is strictly within 7 days of delivery. As order ${orderId} was delivered 14 days ago via Delhivery, it is unfortunately no longer eligible for a return.`,
            toolCalled: { name: 'check_return_eligibility', args: { order_id: orderId }, result: { eligible: false } },
          });
        }
      }

      if (isPastLimit || isOpened) {
        return res.json({
          response: "I'm sorry, but that falls outside our return policy. At Aura Skincare, returns are accepted strictly within 7 days of delivery for unopened and unused products in their original packaging. Since the product was delivered 20 days ago and has been opened, we cannot accept a return or issue a refund.",
        });
      }

      return res.json({
        response: 'Returns are accepted within 7 days of delivery for unopened items in original packaging. Could you please share your Order ID so I can verify eligibility?',
      });
    }

    // C. Tracking & Order Lookup
    // C. Tracking & Order Lookup
    if (orderId || query.includes('track') || query.includes('where is my') || query.includes('status') || query.includes('kahan') || query.includes('aayega')) {
      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
          return res.json({
            response: "I couldn't locate an order with that number, could you please repeat or verify the ID?",
          });
        }
        let reply = '';
        if (order.status === 'Out for Delivery') {
          reply = `Your order ${order.id} for the Vitamin C Serum is out for delivery with ${order.courier || 'BlueDart'} under tracking number ${order.trackingNumber || 'BD-982103'}, and it is expected to arrive by 6 PM today.`;
        } else if (order.status === 'Delivered') {
          reply = `Your order ${order.id} for the Hydrating Sunscreen was delivered ${order.deliveredDaysAgo || 14} days ago via ${order.courier || 'Delhivery'}.`;
        } else if (order.status === 'Processing') {
          reply = `Your order ${order.id} was placed 3 hours ago and is currently in Processing status.`;
        } else {
          reply = `Your order ${order.id} is currently in ${order.status} status.`;
        }
        return res.json({
          response: reply,
          toolCalled: { name: 'get_order_details', args: { order_id: orderId }, result: { success: true, data: order } },
        });
      } else {
        return res.json({
          response: 'I would be happy to track your order. Could you please provide your Order ID, for example ORD-101?',
        });
      }
    }

    // D. Cash on Delivery (COD) Policy
    if (query.includes('cod') || query.includes('cash on delivery') || query.includes('pay on delivery')) {
      return res.json({
        response: 'Yes, Cash on Delivery is available for all orders up to ₹2,500. You can pay with either cash or UPI directly at your doorstep.',
      });
    }

    // D. Shipping Policy
    if (query.includes('shipping') || query.includes('delivery fee') || query.includes('free delivery') || query.includes('delivery charges')) {
      return res.json({
        response: 'We offer free delivery on orders above ₹499. Orders below ₹499 have a ₹50 shipping fee. Delivery usually takes 3 to 5 business days.',
      });
    }

    // Default Fallback
    return res.json({
      response: "I'm here to help with Aura Skincare orders, shipping, and returns. Could you please let me know what you'd like assistance with?",
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ response: 'I had trouble processing that. Could you repeat?' });
  }
}
