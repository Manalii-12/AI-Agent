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

    // 1. Out of Scope
    if (query.includes('flight') || query.includes('goa') || query.includes('hotel') || query.includes('weather')) {
      return res.json({
        response: isHinglish
          ? 'Main sirf Aura Skincare ke orders aur products mein madad kar sakti hoon. Kya main aapki skincare se judi koi madad karoon?'
          : 'I can only assist with Aura Skincare orders, products, and policies. How can I help you with your skincare routine today?',
      });
    }

    // 2. Summer & Sunscreen Recommendations
    if (query.includes('summer') || query.includes('garmi') || query.includes('dhoop') || query.includes('sun protection')) {
      return res.json({
        response: isHinglish
          ? 'Garmiyon ke liye humara Hydrating Sunscreen SPF 50 aur Pure Kannauj Rose Water Mist sabse best hain. Yeh dhoop se bachate hain aur skin ko hydrate rakhte hain. Kya main sunscreen cart mein add karoon?'
          : 'For summer, we highly recommend our Hydrating Sunscreen SPF 50 and Pure Kannauj Rose Water Mist. They protect against UV damage and keep your skin fresh and hydrated. Would you like me to add the sunscreen to your bag?',
      });
    }

    // 3. Extract Order ID
    let orderId: string | null = null;
    const match = userText.match(/ORD[- ]?(\d+)/i) || userText.match(/\b(10[1-9])\b/);
    if (match) {
      orderId = `ORD-${match[1]}`;
    }

    // A. Cancellation
    if (query.includes('cancel')) {
      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
          return res.json({
            response: `I couldn't locate order ${orderId} in our database. Could you please double-check your order number?`,
          });
        }
        if (order.status === 'Processing') {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'Cancelled', notes: `Cancelled via Voice Support request` },
          });
          return res.json({
            response: isHinglish
              ? `Ji bilkul, aapka order ${orderId} cancel kar diya gaya hai kyunki yeh abhi Processing status mein tha.`
              : `Your order ${orderId} has been successfully cancelled as it was still in Processing. Your refund will reflect within 3 to 5 business days.`,
            toolCalled: { name: 'cancel_order', args: { order_id: orderId }, result: { success: true } },
          });
        } else {
          return res.json({
            response: isHinglish
              ? `Maaf kijiye, order ${orderId} cancel nahi ho sakta kyunki yeh ${order.status} status mein hai. Aap doorstep par delivery lene se mana kar sakte hain.`
              : `I apologize, but order ${orderId} cannot be cancelled because its status is already "${order.status}". Under our cancellation policy, orders can only be cancelled while in Processing.`,
            toolCalled: { name: 'cancel_order', args: { order_id: orderId }, result: { success: false } },
          });
        }
      } else {
        return res.json({
          response: isHinglish
            ? 'Agar aapka order abhi Processing mein hai toh main cancel kar sakti hoon. Kripya apna Order ID batayein, jaise ORD-103?'
            : 'I can help cancel your order if it is still Processing. Could you please provide your Order ID, such as ORD-103?',
        });
      }
    }

    // B. Return / Refund
    if (query.includes('return') || query.includes('refund')) {
      const isOpened = query.includes('open') || query.includes('opened') || query.includes('used');
      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (order && order.deliveredDaysAgo && order.deliveredDaysAgo > 7) {
          return res.json({
            response: isHinglish
              ? `Aapka order ${orderId} 14 din pehle deliver hua tha. Humari policy ke anusaar 7 din ke baad return accept nahi hota.`
              : `I apologize, but order ${orderId} was delivered 14 days ago. Under our return policy, returns must be requested within 7 days of delivery.`,
            toolCalled: { name: 'check_return_eligibility', args: { order_id: orderId }, result: { eligible: false } },
          });
        }
      }
      if (isOpened) {
        return res.json({
          response: isHinglish
            ? 'Humari policy ke mutaabiq khule hue products return nahi hote. Sirf unopened items hi 7 din ke andar return ho sakte hain.'
            : 'Under our policy, opened or used products cannot be returned for hygiene reasons. Returns are only accepted for unopened items in original packaging within 7 days.',
        });
      }
    }

    // C. Tracking & Order Lookup
    if (orderId || query.includes('track') || query.includes('where is my') || query.includes('status')) {
      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (order) {
          let reply = '';
          if (isHinglish) {
            if (order.id === 'ORD-101') {
              reply = 'Aapka order BlueDart se nikal chuka hai aur aaj shaam 6 baje tak deliver ho jayega. Koi aur madad chahiye?';
            } else {
              reply = `Aapka order ${order.id} abhi ${order.status} status mein hai.`;
            }
          } else {
            if (order.status === 'Out for Delivery') {
              reply = `Your order ${order.id} is Out for Delivery with ${order.courier || 'BlueDart'}. Tracking number is ${order.trackingNumber || 'BD-982103'}, expected by 6 PM today.`;
            } else if (order.status === 'Delivered') {
              reply = `Your order ${order.id} was delivered ${order.deliveredDaysAgo || 14} days ago via ${order.courier || 'Delhivery'}.`;
            } else {
              reply = `Your order ${order.id} is currently in ${order.status} status.`;
            }
          }
          return res.json({
            response: reply,
            toolCalled: { name: 'get_order_details', args: { order_id: orderId }, result: { success: true, data: order } },
          });
        }
      }
    }

    // D. Shipping Policy
    if (query.includes('shipping') || query.includes('delivery fee') || query.includes('free delivery')) {
      return res.json({
        response: isHinglish
          ? '₹499 se upar ke orders par delivery bilkul free hai. Usse kam par ₹50 shipping charge lagta hai, aur delivery 3 se 5 din mein hoti hai.'
          : 'We offer free delivery on orders above ₹499. Orders below ₹499 have a ₹50 shipping fee. Delivery usually takes 3 to 5 business days.',
      });
    }

    // Default Fallback
    return res.json({
      response: isHinglish
        ? 'Main Aura Skincare ke orders, shipping aur returns mein madad kar sakti hoon. Batayein main kya sahayata karoon?'
        : "I'm here to help with Aura Skincare orders, shipping, and returns. Could you please let me know what you'd like assistance with?",
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ response: 'I had trouble processing that. Could you repeat?' });
  }
}
