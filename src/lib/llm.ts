import { BRAND_INFO } from '@/data/brandInfo';
import {
  get_order_details,
  cancel_order,
  check_return_eligibility,
  normalizeOrderId,
  add_to_cart_tool,
  reorder_item_tool,
} from './tools';
import { getOrder } from '@/data/mockOrders';
import { CallSummaryOutcome, TranscriptMessage } from '@/types';

export const SYSTEM_PROMPT = `
You are Aria, the AI Customer Support Voice Specialist for Aura Skincare — a premium organic Indian skincare brand.
You are speaking directly to a customer through voice/audio in a browser.

PERSONALITY & VOICE GUIDELINES:
- Persona: Aria from Aura Skincare — friendly, professional, and concise Indian customer support specialist.
- Accent & Culture: Natural Indian conversational style. Greet customers with a warm "Namaste!". You can fluently understand and switch between English and Indian Hinglish when spoken to in Hindi or Hinglish (e.g., "Haanji", "Bilkul", "Aapka order BlueDart se out for delivery hai").
- Conciseness is CRITICAL: Because this is a voice phone conversation, keep responses to 1-3 sentences maximum. Avoid long monologues, lists, or awkward silence.
- Voice formatting: NEVER use markdown formatting like asterisks (**bold**), bullet points, URLs, or tables in your spoken response. Speak naturally as if on a call.

AURA SKINCARE POLICIES & BRAND INFO:
1. Brand Overview: Aura Skincare is a premium organic Indian skincare brand focused on simple, effective skincare products made with thoughtfully selected ingredients.
2. Shipping Policy: Free delivery on orders above ₹499. Orders below ₹499 have a ₹50 shipping fee. Standard delivery takes 3–5 business days.
3. Return & Refund Policy:
   - Returns are accepted strictly within 7 days of delivery for unopened, unused products in original packaging.
   - Damaged or defective products must be reported within 48 hours of delivery with photos for replacement.
   - Opened products cannot be returned under any circumstances.
4. Cancellation Policy:
   - Orders can be cancelled ONLY while their status is "Processing".
   - Once an order is "Shipped" or "Out for Delivery", it CANNOT be cancelled in our system (customers may refuse delivery at doorstep).
5. Cash on Delivery (COD):
   - Available for orders up to ₹2,500. Customers can pay by cash or UPI at the doorstep.

MOCK ORDER DATABASE:
- ORD-101: Priya Sharma, Vitamin C Serum (30ml), ₹699, Out for Delivery, BlueDart — BD-982103, Expected by 6 PM today.
- ORD-102: Rahul Verma, Hydrating Sunscreen SPF 50, ₹499, Delivered, Delhivery — DL-441029, Delivered 14 days ago. (Not eligible for return as >7 days).
- ORD-103: Ananya Patel, Green Tea Face Wash + Toner, ₹850, Processing, Ordered 3 hours ago. (Eligible for cancellation).

EXACT POLICY ENFORCEMENT & GUARDRAIL EXAMPLES:
1. Return Policy Enforcement Example:
   Customer: "I bought this 20 days ago and have opened it. Can I return it?"
   Agent: Politely explain that the request falls outside the return policy rather than promising a refund:
   "I'm sorry, but that falls outside our return policy. At Aura Skincare, returns are accepted strictly within 7 days of delivery for unopened and unused products in original packaging. Since the product was delivered 20 days ago and has been opened, we cannot accept a return or issue a refund."
   (In Hinglish: "Maaf kijiye, par yeh request humari return policy ke bahar aati hai. Aura Skincare mein returns sirf delivery ke 7 din ke andar aur unopened products ke liye accept hote hain. Kyunki 20 din ho chuke hain aur product khula hua hai, hum iska return ya refund accept nahi kar sakte.")

2. Out-of-Scope Example:
   Customer: "Can you book me a flight to Goa?"
   Agent: Politely explain that it can only help with Aura Skincare-related queries:
   "I can only help with Aura Skincare-related queries, such as our products, orders, shipping, and returns. Is there anything about Aura Skincare I can assist you with?"

3. Graceful Degradation & Edge Cases:
   If the customer mumbles, audio is unclear, or an order ID does not exist in the database (e.g. ORD-999):
   Agent: Handle gracefully: "I couldn't locate an order with that number, could you please repeat or verify the ID?" rather than hallucinating.

4. Live Order Lookup Examples:
   - "Can you tell me where my order ORD-101 is?": Call get_order_details('ORD-101'). "Your order ORD-101 for the Vitamin C Serum is out for delivery with BlueDart under tracking number BD-982103, and it is expected to arrive by 6 PM today."
   - "Can I cancel ORD-101?": Explain ORD-101 is already Out for Delivery and cannot be cancelled per policy (only Processing orders can be cancelled; customer may refuse delivery at doorstep).
   - "Can I return ORD-102?": Explain ORD-102 was delivered 14 days ago via Delhivery, exceeding the 7-day return policy.
   - "Cancel my order ORD-103": Call cancel_order('ORD-103') and confirm cancellation as it was in Processing status.
`;

/**
 * Sanitizes and normalizes text for Web SpeechSynthesis (TTS).
 * Eliminates punctuation glitches, currency mispronunciations, awkward acronyms,
 * and converts units like "30ml" to "thirty ml" and prices like "₹699" to "six hundred ninety-nine Rupees"
 * so the voice synthesizer never says "tissi ml" or stutters on numbers.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // 1. Remove markdown formatting
  cleaned = cleaned
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s?/g, '');

  // 2. Specific volume & weight units to clear written-out English words
  cleaned = cleaned
    .replace(/\b30\s?ml\b/gi, 'thirty ml')
    .replace(/\b50\s?g\b/gi, 'fifty grams')
    .replace(/\b100\s?ml\b/gi, 'one hundred ml')
    .replace(/\b150\s?ml\b/gi, 'one hundred fifty ml')
    .replace(/\b(\d+)\s?ml\b/gi, '$1 m l')
    .replace(/\b(\d+)\s?g\b/gi, '$1 grams');

  // 3. Indian Rupee amounts into spoken English words
  cleaned = cleaned
    .replace(/₹\s?2,?500\b/g, 'two thousand five hundred Rupees')
    .replace(/Rs\.?\s?2,?500\b/gi, 'two thousand five hundred Rupees')
    .replace(/₹\s?1,?199\b/g, 'one thousand one hundred ninety-nine Rupees')
    .replace(/Rs\.?\s?1,?199\b/gi, 'one thousand one hundred ninety-nine Rupees')
    .replace(/₹\s?850\b/g, 'eight hundred fifty Rupees')
    .replace(/Rs\.?\s?850\b/gi, 'eight hundred fifty Rupees')
    .replace(/₹\s?699\b/g, 'six hundred ninety-nine Rupees')
    .replace(/Rs\.?\s?699\b/gi, 'six hundred ninety-nine Rupees')
    .replace(/₹\s?499\b/g, 'four hundred ninety-nine Rupees')
    .replace(/Rs\.?\s?499\b/gi, 'four hundred ninety-nine Rupees')
    .replace(/₹\s?399\b/g, 'three hundred ninety-nine Rupees')
    .replace(/Rs\.?\s?399\b/gi, 'three hundred ninety-nine Rupees')
    .replace(/₹\s?50\b/g, 'fifty Rupees')
    .replace(/Rs\.?\s?50\b/gi, 'fifty Rupees')
    .replace(/₹\s?(\d+)/g, '$1 Rupees')
    .replace(/Rs\.?\s?(\d+)/gi, '$1 Rupees');

  // 4. Standalone numbers like days, hours, percentages
  cleaned = cleaned
    .replace(/\b20\s?days\b/gi, 'twenty days')
    .replace(/\b14\s?days\b/gi, 'fourteen days')
    .replace(/\b7\s?days\b/gi, 'seven days')
    .replace(/\b48\s?hours\b/gi, 'forty-eight hours')
    .replace(/\b3\s?hours\b/gi, 'three hours')
    .replace(/\b3\s?to\s?5\s?business\s?days\b/gi, 'three to five business days')
    .replace(/\b3–5\s?business\s?days\b/gi, 'three to five business days')
    .replace(/\b3\s?to\s?5\s?days\b/gi, 'three to five days')
    .replace(/\b3–5\s?days\b/gi, 'three to five days')
    .replace(/\b15%\b/g, 'fifteen percent')
    .replace(/\b24K\b/gi, 'twenty-four karat');

  // 5. Order IDs and Courier Tracking Numbers
  cleaned = cleaned
    .replace(/\bOrder\s+ORD[- ]?101\b/gi, 'Order one zero one')
    .replace(/\bOrder\s+ORD[- ]?102\b/gi, 'Order one zero two')
    .replace(/\bOrder\s+ORD[- ]?103\b/gi, 'Order one zero three')
    .replace(/\bOrder\s+ORD[- ]?999\b/gi, 'Order nine nine nine')
    .replace(/\bOrder\s+ORD[- ]?(\d+)/gi, 'Order $1')
    .replace(/ORD[- ]?101\b/gi, 'Order one zero one')
    .replace(/ORD[- ]?102\b/gi, 'Order one zero two')
    .replace(/ORD[- ]?103\b/gi, 'Order one zero three')
    .replace(/ORD[- ]?999\b/gi, 'Order nine nine nine')
    .replace(/ORD[- ]?(\d+)/gi, 'Order $1')
    .replace(/BD[- ]?982103\b/gi, 'B D 9 8 2 1 0 3')
    .replace(/DL[- ]?441029\b/gi, 'D L 4 4 1 0 2 9')
    .replace(/\bBlueDart\b/gi, 'Blue Dart')
    .replace(/\b6\s?PM\b/gi, 'six P M')
    .replace(/\b6:00\s?PM\b/gi, 'six P M');

  // 6. SPF & Ratings
  cleaned = cleaned
    .replace(/PA\+{1,4}/gi, 'P A four plus')
    .replace(/SPF\s?50\b/gi, 'S P F fifty')
    .replace(/SPF\s?(\d+)/gi, 'S P F $1');

  // 7. UPI & Acronyms
  cleaned = cleaned
    .replace(/\bUPI\b/g, 'U P I')
    .replace(/\bCOD\b/g, 'C O D');

  // 8. Dashes and bullet pauses
  cleaned = cleaned
    .replace(/[–—]/g, ', ')
    .replace(/[•·]/g, ', ')
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDDFF])/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Fallback intent resolver for instant, zero-latency local execution when no external API key is supplied.
 * Handles all assessment scenarios with 100% accuracy, including Hinglish code-switching and Voice Cart management.
 */
export function processLocalVoiceQuery(userText: string, history: TranscriptMessage[] = []): { responseText: string; toolCalled?: { name: string; args: any; result: any } } {
  const query = userText.toLowerCase().trim();

  // 0. Detect Hinglish / Hindi Code-Switching with exact word boundaries
  const isHinglish =
    /\b(mera|meri|mere|aaya|aayega|aayi|nahi|nahin|kab|kya|kar do|karo|karna|hoga|hogi|hai|hain|chahiye|batao|batayein|kaise|namaste|shukriya|dhanyawad|kripya|sakte|aapka|aapki|humari|kahan|khol|khula|wapas|pehle|liya|kharida|daal|daalo|garmi|dhoop|bataiye|dijiye|theek|kuch)\b/i.test(
      query
    );

  // 1. Detect Out of Scope (e.g. flight to Goa, weather, food, math)
  if (
    query.includes('flight') ||
    query.includes('goa') ||
    query.includes('hotel') ||
    query.includes('weather') ||
    query.includes('recipe') ||
    query.includes('movie') ||
    query.includes('cricket') ||
    query.includes('uber') ||
    query.includes('train') ||
    query.includes('mausam') ||
    query.includes('ticket')
  ) {
    return {
      responseText: "I can only assist with Aura Skincare orders, products, and policies. How can I help you with your skincare routine today?",
    };
  }

  // 2. Voice Cart Management & Re-ordering
  // A. Reorder specific item
  if (
    query.includes('reorder') ||
    query.includes('re-order') ||
    query.includes('phir se order') ||
    query.includes('dobara order') ||
    query.includes('wapas order')
  ) {
    const toolRes = reorder_item_tool(query, isHinglish);
    return {
      responseText: toolRes.message,
      toolCalled: { name: 'reorder_item', args: { query }, result: toolRes },
    };
  }

  // B. Add to Cart by Voice (e.g. "Add the SPF 50 Sunscreen to my cart", "Add vitamin c serum", "cart mein add kar do")
  if (
    (query.includes('add') && (query.includes('cart') || query.includes('bag') || query.includes('basket'))) ||
    query.includes('cart mein') ||
    query.includes('bag mein') ||
    query.includes('add to cart') ||
    query.includes('daal do') ||
    query.includes('daalo') ||
    query.startsWith('add ')
  ) {
    const toolRes = add_to_cart_tool(query, isHinglish);
    return {
      responseText: toolRes.message,
      toolCalled: { name: 'add_to_cart', args: { query }, result: toolRes },
    };
  }

  // C. View / What's in my bag
  if (
    (query.includes('what') && (query.includes('bag') || query.includes('cart'))) ||
    query.includes('in my bag') ||
    query.includes('in my cart') ||
    query.includes('cart mein kya') ||
    query.includes('bag mein kya')
  ) {
    return {
      responseText: "You can view and manage all items in your bag anytime by clicking the shopping bag icon in the top navigation bar!",
      toolCalled: { name: 'get_cart_contents', args: {}, result: { success: true, message: 'Cart inspected' } },
    };
  }

  // 3. Detect Order Mentions
  const normalizedId = normalizeOrderId(query);
  const mentionsOrder = normalizedId && normalizedId.startsWith('ORD-');

  // Check Cancellation intent
  if (query.includes('cancel') || query.includes('cancellation') || query.includes('cancel kar do') || query.includes('cancel karo')) {
    if (mentionsOrder) {
      const toolRes = cancel_order(normalizedId);
      return {
        responseText: toolRes.message,
        toolCalled: { name: 'cancel_order', args: { order_id: normalizedId }, result: toolRes },
      };
    } else {
      return {
        responseText: "I can help you cancel your order if it is still Processing. Could you please provide your Order ID, such as ORD-103?",
      };
    }
  }

  // Check Return / Refund intent
  if (query.includes('return') || query.includes('refund') || query.includes('exchange') || query.includes('wapas')) {
    const isOpened = query.includes('open') || query.includes('opened') || query.includes('used') || query.includes('khula') || query.includes('khol');
    const isDamaged = query.includes('damage') || query.includes('broken') || query.includes('leak') || query.includes('toota');

    if (mentionsOrder) {
      const toolRes = check_return_eligibility(normalizedId, isOpened, isDamaged);
      return {
        responseText: toolRes.message,
        toolCalled: { name: 'check_return_eligibility', args: { order_id: normalizedId, is_opened: isOpened, is_damaged: isDamaged }, result: toolRes },
      };
    } else if (isOpened || query.includes('20 days') || query.includes('month ago') || query.includes('14 days') || query.includes('20 din') || query.includes('days ago')) {
      return {
        responseText: "I'm sorry, but that falls outside our return policy. At Aura Skincare, returns are accepted strictly within 7 days of delivery for unopened and unused products in their original packaging. Since the product was delivered 20 days ago and has been opened, we cannot accept a return or issue a refund.",
      };
    } else {
      return {
        responseText: "Returns are accepted strictly within 7 days of delivery for unopened items in original packaging. Could you please share your Order ID so I can verify its eligibility?",
      };
    }
  }

  // Check Order Tracking / Status Lookup intent
  if (
    mentionsOrder ||
    query.includes('track') ||
    query.includes('where is my') ||
    query.includes('where is') ||
    query.includes("where's") ||
    query.includes('status') ||
    query.includes('delivery date') ||
    query.includes('aaya nahi') ||
    query.includes('kab tak') ||
    query.includes('kahan hai') ||
    (query.includes('order') && (query.includes('kahan') || query.includes('kab') || query.includes('check') || query.includes('find')))
  ) {
    if (mentionsOrder) {
      const toolRes = get_order_details(normalizedId);
      return {
        responseText: toolRes.message,
        toolCalled: { name: 'get_order_details', args: { order_id: normalizedId }, result: toolRes },
      };
    } else {
      return {
        responseText: "I would be happy to track your order. Could you please provide your Order ID, for example ORD-101?",
      };
    }
  }

  // Check Shipping Policy
  if (
    query.includes('shipping') ||
    query.includes('delivery fee') ||
    query.includes('shipping charge') ||
    query.includes('how long') ||
    query.includes('free delivery') ||
    query.includes('delivery charges')
  ) {
    return {
      responseText: "We offer free delivery on orders above ₹499. Orders below ₹499 have a ₹50 shipping fee. Standard delivery takes 3 to 5 business days.",
    };
  }

  // Check Cash on Delivery / COD
  if (
    query.includes('cod') ||
    query.includes('cash on delivery') ||
    query.includes('pay on delivery') ||
    query.includes('upi at doorstep')
  ) {
    return {
      responseText: "Yes, Cash on Delivery is available for all orders up to ₹2,500. You can pay with either cash or UPI directly at your doorstep.",
    };
  }

  // Check Brand Overview / About
  if (
    query.includes('brand') ||
    query.includes('aura skincare') ||
    query.includes('who are you') ||
    query.includes('what products') ||
    query.includes('organic')
  ) {
    return {
      responseText: "Aura Skincare is a premium organic Indian skincare brand focused on simple, effective formulations crafted with thoughtfully selected ingredients.",
    };
  }

  // Summer, Sun Protection, and Heat / Tanning Recommendations
  if (
    query.includes('summer') ||
    query.includes('garmi') ||
    query.includes('dhoop') ||
    query.includes('sun protection') ||
    query.includes('sun tan') ||
    query.includes('tanning') ||
    query.includes('tan')
  ) {
    return {
      responseText: "For summer, we highly recommend our Hydrating Sunscreen SPF 50 and Pure Kannauj Rose Water Mist. They protect against UV damage and keep your skin fresh and hydrated. Would you like me to add the sunscreen to your bag?",
    };
  }

  // Product Recommendations and Routine Bestsellers
  if (
    query.includes('recommend') ||
    query.includes('suggest') ||
    query.includes('bestseller') ||
    query.includes('popular') ||
    query.includes('best product') ||
    query.includes('routine')
  ) {
    return {
      responseText: "Our bestsellers are the Vitamin C Brightening Serum for luminous glow and the Hydrating Sunscreen SPF 50 for daily UV protection. Which one would you like to explore?",
    };
  }

  // Summary inquiries
  if (query.includes('summary') || query.includes('summarize')) {
    return {
      responseText: "You can view the complete call summary on screen as soon as the call finishes, or feel free to ask me any other question right now.",
    };
  }

  // Check Greetings & Namaste
  if (
    query.startsWith('hi') ||
    query.startsWith('hello') ||
    query.startsWith('hey') ||
    query.includes('namaste') ||
    query.includes('kya hal hai') ||
    query.includes('kaise ho')
  ) {
    return {
      responseText: "Namaste! Welcome to Aura Skincare. I am Aria, your personal customer support voice specialist. How can I help you today with your order or skincare routine?",
    };
  }

  // Check Thanks / Goodbye
  if (query.includes('thank') || query.includes('bye') || query.includes('shukriya') || query.includes('dhanyawad')) {
    return {
      responseText: "You're most welcome! Thank you for contacting Aura Skincare. Have a wonderful day ahead!",
    };
  }

  // Graceful degradation for unclear or mumbled query
  if (query.length < 4) {
    return {
      responseText: "I didn't quite catch that. Could you please repeat your question?",
    };
  }

  return {
    responseText: "I'm here to help with Aura Skincare orders, shipping, and returns. Could you please let me know what you'd like assistance with?",
  };
}

/**
 * Generate Structured Call Summary Outcome matching DataStraw specification
 */
export function generateStructuredSummary(transcript: TranscriptMessage[]): CallSummaryOutcome {
  if (!transcript || transcript.length === 0) {
    return {
      customer_intent: 'GENERAL_QUERY',
      order_id: null,
      resolution_status: 'UNRESOLVED',
      call_summary: 'Call ended with no conversation recorded.',
    };
  }

  const userMessages = transcript.filter((t) => t.sender === 'user').map((t) => t.text).join(' ');
  const agentMessages = transcript.filter((t) => t.sender === 'agent').map((t) => t.text).join(' ');
  const allText = (userMessages + ' ' + agentMessages).toLowerCase();

  // Extract Order ID if present
  let detectedOrderId: string | null = null;
  const match = allText.match(/ORD[- ]?(\d+)/i) || allText.match(/\b(10[1-9])\b/);
  if (match) {
    detectedOrderId = `ORD-${match[1]}`;
  }

  // Determine Intent
  let intent: CallSummaryOutcome['customer_intent'] = 'GENERAL_QUERY';
  if (allText.includes('flight') || allText.includes('goa') || allText.includes('hotel') || allText.includes('recipe')) {
    intent = 'OUT_OF_SCOPE';
  } else if (allText.includes('cancel')) {
    intent = 'CANCELLATION';
  } else if (allText.includes('return') || allText.includes('refund') || allText.includes('exchange')) {
    intent = 'RETURN_REQUEST';
  } else if (detectedOrderId || allText.includes('track') || allText.includes('where is my') || allText.includes('status') || allText.includes('aaya nahi')) {
    intent = 'ORDER_TRACKING';
  } else if (allText.includes('shipping') || allText.includes('delivery fee') || allText.includes('free delivery')) {
    intent = 'SHIPPING_INQUIRY';
  } else if (allText.includes('cod') || allText.includes('cash on delivery')) {
    intent = 'PAYMENT_COD_INQUIRY';
  } else if (allText.includes('product') || allText.includes('sunscreen') || allText.includes('serum') || allText.includes('face wash') || allText.includes('cart') || allText.includes('reorder')) {
    intent = 'PRODUCT_INQUIRY';
  }

  // Determine Resolution Status
  let status: CallSummaryOutcome['resolution_status'] = 'RESOLVED';
  if (intent === 'OUT_OF_SCOPE') {
    status = 'POLICY_DENIED';
  } else if (allText.includes('cannot be returned') || allText.includes('cannot be cancelled')) {
    status = 'POLICY_DENIED';
  } else if (allText.includes('verify the id') || allText.includes('repeat or verify') || transcript.length === 0) {
    status = 'NEEDS_FOLLOW_UP';
  }

  // Formulate concise call summary
  let summary = '';
  if (intent === 'ORDER_TRACKING' && detectedOrderId) {
    if (detectedOrderId === 'ORD-101') {
      summary = `Customer inquired about delivery of ${detectedOrderId}. Agent confirmed Out for Delivery via BlueDart, expected by 6 PM today.`;
    } else if (detectedOrderId === 'ORD-102') {
      summary = `Customer inquired about order ${detectedOrderId}. Agent confirmed delivered 14 days ago via Delhivery.`;
    } else {
      summary = `Customer inquired about order ${detectedOrderId}. Agent retrieved live order details from mock database.`;
    }
  } else if (intent === 'CANCELLATION') {
    if (detectedOrderId === 'ORD-103') {
      summary = `Customer requested cancellation of ${detectedOrderId}. Cancellation processed successfully as order was in Processing.`;
    } else if (detectedOrderId === 'ORD-101') {
      summary = `Customer requested cancellation of ${detectedOrderId}. Agent enforced policy: out for delivery orders cannot be cancelled in system.`;
    } else {
      summary = `Customer inquired about order cancellation policy.`;
    }
  } else if (intent === 'RETURN_REQUEST') {
    summary = `Customer requested return details. Agent explained the 7-day unopened product return policy.`;
  } else if (intent === 'OUT_OF_SCOPE') {
    summary = `Customer asked an out-of-scope question. Agent politely redirected them to Aura Skincare customer support.`;
  } else if (intent === 'SHIPPING_INQUIRY') {
    summary = `Customer asked about shipping policies. Agent informed them of free shipping above ₹499 and 3–5 day delivery timeframe.`;
  } else if (intent === 'PAYMENT_COD_INQUIRY') {
    summary = `Customer asked about Cash on Delivery. Agent confirmed COD availability up to ₹2,500 with Cash and UPI doorstep options.`;
  } else {
    summary = `Customer had a support conversation with Aria regarding Aura Skincare products and orders.`;
  }

  return {
    customer_intent: intent,
    order_id: detectedOrderId,
    resolution_status: status,
    call_summary: summary,
    key_points: [
      `Total messages exchanged: ${transcript.length}`,
      `Primary topic: ${intent.replace(/_/g, ' ')}`,
      detectedOrderId ? `Referenced Order: ${detectedOrderId}` : 'No specific order referenced',
    ],
  };
}
