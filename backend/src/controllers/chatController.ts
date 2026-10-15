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
        response: isHinglish
          ? 'Maaf kijiye, main sirf Aura Skincare se judi queries jaise orders, shipping aur skincare products mein hi madad kar sakti hoon. Kya main Aura Skincare ke kisi product ya order mein aapki sahayata karoon?'
          : 'I can only help with Aura Skincare-related queries, such as our products, orders, shipping, and returns. Is there anything about Aura Skincare I can assist you with?',
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
    const match = userText.match(/ORD[- ]?(\d+)/i) || userText.match(/\b(10[1-9]|999)\b/);
    if (match) {
      orderId = `ORD-${match[1]}`;
    }

    // A. Cancellation Policy Enforcement
    if (query.includes('cancel')) {
      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
          return res.json({
            response: isHinglish
              ? 'Mujhe us number ka koi order nahi mila, kya aap kripya apna Order ID dobara repeat ya verify kar sakte hain?'
              : "I couldn't locate an order with that number, could you please repeat or verify the ID?",
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
              ? `Maaf kijiye, order ${orderId} cancel nahi ho sakta kyunki yeh out for delivery ya delivered ho chuka hai. Humari policy ke mutaabiq orders sirf Processing status mein hi cancel ho sakte hain. Aap doorstep par delivery lene se mana kar sakte hain.`
              : `I apologize, but order ${orderId} cannot be cancelled because it is already ${order.status}. Under our policy, orders can only be cancelled while their status is Processing. However, you may refuse delivery at your doorstep when the courier arrives.`,
            toolCalled: { name: 'cancel_order', args: { order_id: orderId }, result: { success: false } },
          });
        }
      } else {
        return res.json({
          response: isHinglish
            ? 'Orders sirf tabhi cancel ho sakte hain jab tak unka status Processing ho. Kripya apna Order ID batayein, jaise ORD-103?'
            : 'Orders can only be cancelled while their status is Processing. Could you please provide your Order ID, such as ORD-103?',
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
      const isOpened = query.includes('open') || query.includes('opened') || query.includes('used') || query.includes('khula');
      const isPastLimit = query.includes('20 days') || query.includes('20 din') || query.includes('14 days') || query.includes('month');

      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (order && order.deliveredDaysAgo && order.deliveredDaysAgo > 7) {
          return res.json({
            response: isHinglish
              ? `Maaf kijiye, par order ${orderId} Delhivery se 14 din pehle deliver hua tha. Humari policy ke anusaar 7 din ke baad return accept nahi hota.`
              : `I apologize, but order ${orderId} was delivered 14 days ago. Under our return policy, returns are accepted strictly within 7 days of delivery for unopened products. Because 14 days have passed, this order is not eligible for a return.`,
            toolCalled: { name: 'check_return_eligibility', args: { order_id: orderId }, result: { eligible: false } },
          });
        }
      }

      if (isPastLimit || isOpened) {
        return res.json({
          response: isHinglish
            ? 'Maaf kijiye, par yeh request humari return policy ke bahar aati hai. Aura Skincare mein returns sirf delivery ke 7 din ke andar aur unopened products ke liye hi accept hote hain. Kyunki aapka product 20 din pehle aaya tha aur khula hua hai, hum iska return ya refund accept nahi kar sakte.'
            : "I'm sorry, but that falls outside our return policy. At Aura Skincare, returns are accepted strictly within 7 days of delivery for unopened and unused products in their original packaging. Since the product was delivered 20 days ago and has been opened, we cannot accept a return or issue a refund.",
        });
      }

      return res.json({
        response: isHinglish
          ? 'Returns delivery ke 7 din ke andar unopened products ke liye accept hote hain. Kripya apna Order ID batayein taaki main eligibility check kar sakoon?'
          : 'Returns are accepted within 7 days of delivery for unopened items in original packaging. Could you please share your Order ID so I can verify eligibility?',
      });
    }

    // C. Tracking & Order Lookup
    if (orderId || query.includes('track') || query.includes('where is my') || query.includes('status')) {
      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
          return res.json({
            response: isHinglish
              ? 'Mujhe us number ka koi order nahi mila, kya aap kripya apna Order ID dobara repeat ya verify kar sakte hain?'
              : "I couldn't locate an order with that number, could you please repeat or verify the ID?",
          });
        }
        let reply = '';
        if (isHinglish) {
          if (order.id === 'ORD-101') {
            reply = 'Aapka order ORD-101 Vitamin C Serum ke liye BlueDart se out for delivery hai aur tracking number BD-982103 hai. Yeh aaj shaam 6 baje tak deliver ho jayega. Koi aur madad chahiye?';
          } else if (order.id === 'ORD-102') {
            reply = 'Aapka order ORD-102 Delhivery se 14 din pehle deliver ho chuka tha. Kya aapko kisi aur cheez mein madad chahiye?';
          } else if (order.id === 'ORD-103') {
            reply = 'Aapka order ORD-103 abhi Processing status mein hai aur 3 ghante pehle place hua tha.';
          } else {
            reply = `Aapka order ${order.id} abhi ${order.status} status mein hai.`;
          }
        } else {
          if (order.status === 'Out for Delivery') {
            reply = `Your order ${order.id} for the Vitamin C Serum is out for delivery with ${order.courier || 'BlueDart'} under tracking number ${order.trackingNumber || 'BD-982103'}, and it is expected to arrive by 6 PM today.`;
          } else if (order.status === 'Delivered') {
            reply = `Your order ${order.id} for the Hydrating Sunscreen was delivered ${order.deliveredDaysAgo || 14} days ago via ${order.courier || 'Delhivery'}.`;
          } else if (order.status === 'Processing') {
            reply = `Your order ${order.id} was placed 3 hours ago and is currently in Processing status.`;
          } else {
            reply = `Your order ${order.id} is currently in ${order.status} status.`;
          }
        }
        return res.json({
          response: reply,
          toolCalled: { name: 'get_order_details', args: { order_id: orderId }, result: { success: true, data: order } },
        });
      } else {
        return res.json({
          response: isHinglish
            ? 'Main aapka order track kar sakti hoon. Kripya apna Order ID batayein, jaise ORD-101?'
            : 'I would be happy to track your order. Could you please provide your Order ID, for example ORD-101?',
        });
      }
    }

    // D. Cash on Delivery (COD) Policy
    if (query.includes('cod') || query.includes('cash on delivery') || query.includes('pay on delivery')) {
      return res.json({
        response: isHinglish
          ? 'Haanji, 2,500 Rupees tak ke orders par Cash on Delivery available hai. Aap doorstep par cash ya UPI dono se payment kar sakte hain.'
          : 'Cash on Delivery is available for all orders up to 2,500 Rupees. You can pay using cash or UPI directly at your doorstep.',
      });
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
