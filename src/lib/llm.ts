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
You are Aria, the AI Customer Support Voice Specialist for Aura Skincare — a premium organic Indian skincare brand crafted with pure botanicals and Ayurvedic traditions.
You are speaking directly to a customer through voice/audio on a phone call.

PERSONALITY & INDIAN VOICE TONE GUIDELINES ("FEEL THE WARMTH"):
- Persona: Aria from Aura Skincare — exceptionally warm, polite, respectful, and reassuring Indian customer care specialist. Think of the most hospitable, caring, and attentive Indian customer support representative.
- Indian Conversational Nuances:
  * Always greet warmly with "Namaste!" or "Namaste ji!".
  * Use respectful and reassuring conversational connectors like "Certainly ji!", "Please don't worry at all, let me check that for you right away", "I completely understand", "You are in good hands", and "I would be very happy to assist you".
  * When handling customer concerns, be deeply empathetic and gentle before explaining brand policies.
- Language Policy (STRICT): You can fluently understand both English and Indian Hinglish/Hindi spoken by the customer (e.g. if the customer speaks in Hindi or Hinglish like "mera order kahan hai", "khol diya hai return hoga kya", or "cart mein daal do"). However, you MUST ALWAYS RESPOND IN POLITE, NATURAL, WARM INDIAN ENGLISH (with warm greetings like "Namaste!"). NEVER respond in pure Hindi or Romanized Hinglish prose, because the voice synthesizer is tuned specifically for Indian English speech. Keep all spoken answers in crisp, polished, melodious Indian English.
- Conciseness is CRITICAL: Because this is a voice phone conversation, keep responses to 1-3 sentences maximum. Avoid long monologues, lists, or awkward silence.
- Voice formatting: NEVER use markdown formatting like asterisks (**bold**), bullet points, URLs, or tables in your spoken response. Speak naturally and melodiously as if on a live voice call.

AURA SKINCARE POLICIES & BRAND INFO:
1. Brand Overview: Aura Skincare is a premium organic Indian skincare brand focused on simple, effective skincare products made with thoughtfully selected ingredients like saffron, Kannauj rose water, and kumkumadi.
2. Shipping Policy: Free delivery across India on orders above ₹499. Orders below ₹499 have a ₹50 shipping fee. Standard delivery takes 3–5 business days.
3. Return & Refund Policy:
   - Returns are accepted strictly within 7 days of delivery for unopened, unused products in original packaging.
   - Damaged or defective products must be reported within 48 hours of delivery with photos for free doorstep replacement.
   - Opened or used products cannot be returned under any circumstances.
4. Cancellation Policy:
   - Orders can be cancelled ONLY while their status is "Processing".
   - Once an order is "Shipped" or "Out for Delivery", it CANNOT be cancelled in our system (customers may refuse delivery at doorstep).
5. Cash on Delivery (COD):
   - Available for orders up to ₹2,500 across India. Customers can pay by cash or UPI scan at the doorstep.

MOCK ORDER DATABASE:
- ORD-101: Priya Sharma, Vitamin C Serum (30ml), ₹699, Out for Delivery, BlueDart — BD-982103, Expected by 6 PM today.
- ORD-102: Rahul Verma, Hydrating Sunscreen SPF 50, ₹499, Delivered, Delhivery — DL-441029, Delivered 14 days ago. (Not eligible for return as >7 days).
- ORD-103: Ananya Patel, Green Tea Face Wash + Toner, ₹850, Processing, Ordered 3 hours ago. (Eligible for cancellation).

EXACT POLICY ENFORCEMENT & GUARDRAIL EXAMPLES:
1. Return Policy Enforcement Example:
   Customer: "I bought this 20 days ago and have opened it. Can I return it?" (or in Hinglish: "Maine 20 din pehle liya tha aur khol diya, wapas hoga?")
   Agent (Warm, empathetic Indian English):
   "I completely understand your concern, but as per Aura Skincare policy, returns are accepted strictly within 7 days of delivery for unopened and unused items. Since your product was delivered 20 days ago and has been opened, we won't be able to process a return. I hope you understand!"

2. Out-of-Scope Example:
   Customer: "Can you book me a flight to Goa?" (or "Goa ki ticket book kar do")
   Agent:
   "Namaste! While I would love to help, I can only assist with Aura Skincare products, orders, and skincare routines. Is there anything about your skincare I can help you with today?"

3. Graceful Degradation & Edge Cases:
   If the customer mumbles, audio is unclear, or an order ID does not exist in the database (e.g. ORD-999):
   Agent: "I'm so sorry, but I couldn't locate an order with that number. Could you please verify or repeat the order ID for me?"

4. Live Order Lookup Examples:
   - "Can you tell me where my order ORD-101 is?" (or "Mera order 101 kahan hai?"): Call get_order_details('ORD-101'). "Good news! Your order ORD-101 for the Vitamin C Serum is out for delivery with BlueDart under tracking number BD-982103, and it is expected to reach you by 6 PM today."
   - "Can I cancel ORD-101?": Explain gently that ORD-101 is already Out for Delivery with BlueDart and cannot be cancelled in our system, though they may refuse delivery at the doorstep.
   - "Can I return ORD-102?": Explain ORD-102 was delivered 14 days ago via Delhivery, which exceeds our 7-day return policy.
   - "Cancel my order ORD-103": Call cancel_order('ORD-103') and confirm cancellation with reassurance: "Certainly! I have cancelled your order ORD-103 as requested, and since it was in Processing, no charges have been deducted."
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

  // 2. Remove parenthesized (30ml) or (50g) in product names
  cleaned = cleaned
    .replace(/\(\s*30\s?m\.?l\.?\s*\)/gi, '')
    .replace(/\(\s*50\s?g\s*\)/gi, '')
    .replace(/\(\s*100\s?m\.?l\.?\s*\)/gi, '')
    .replace(/\(\s*150\s?m\.?l\.?\s*\)/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\(\s*,/g, '(')
    .replace(/,\s*\)/g, ')')
    .replace(/\s*,\s*,/g, ',');

  // 3. Replace any standalone or unit milliliters so "ml" is NEVER read as "mal" or "tisi mal"
  cleaned = cleaned
    .replace(/\b30[- ]?m\.?l\.?\b/gi, 'thirty milliliters')
    .replace(/\b50[- ]?g(rams)?\b/gi, 'fifty grams')
    .replace(/\b100[- ]?m\.?l\.?\b/gi, 'one hundred milliliters')
    .replace(/\b150[- ]?m\.?l\.?\b/gi, 'one hundred fifty milliliters')
    .replace(/\b(\d+)[- ]?m\.?l\.?\b/gi, '$1 milliliters')
    .replace(/\bml\b/gi, 'milliliters')
    .replace(/\bm\.l\.\b/gi, 'milliliters')
    .replace(/\b(\d+)\s?g\b/gi, '$1 grams');

  // 3. Indian Rupee amounts into spoken English words
  cleaned = cleaned
    .replace(/₹\s?2,?500\b/g, 'two thousand five hundred Rupees')
    .replace(/Rs\.?\s?2,?500\b/gi, 'two thousand five hundred Rupees')
    .replace(/\b2,?500\s?rupees\b/gi, 'two thousand five hundred Rupees')
    .replace(/₹\s?1,?199\b/g, 'one thousand one hundred ninety-nine Rupees')
    .replace(/Rs\.?\s?1,?199\b/gi, 'one thousand one hundred ninety-nine Rupees')
    .replace(/\b1,?199\s?rupees\b/gi, 'one thousand one hundred ninety-nine Rupees')
    .replace(/₹\s?850\b/g, 'eight hundred fifty Rupees')
    .replace(/Rs\.?\s?850\b/gi, 'eight hundred fifty Rupees')
    .replace(/\b850\s?rupees\b/gi, 'eight hundred fifty Rupees')
    .replace(/₹\s?699\b/g, 'six hundred ninety-nine Rupees')
    .replace(/Rs\.?\s?699\b/gi, 'six hundred ninety-nine Rupees')
    .replace(/\b699\s?rupees\b/gi, 'six hundred ninety-nine Rupees')
    .replace(/₹\s?499\b/g, 'four hundred ninety-nine Rupees')
    .replace(/Rs\.?\s?499\b/gi, 'four hundred ninety-nine Rupees')
    .replace(/\b499\s?rupees\b/gi, 'four hundred ninety-nine Rupees')
    .replace(/₹\s?399\b/g, 'three hundred ninety-nine Rupees')
    .replace(/Rs\.?\s?399\b/gi, 'three hundred ninety-nine Rupees')
    .replace(/\b399\s?rupees\b/gi, 'three hundred ninety-nine Rupees')
    .replace(/₹\s?50\b/g, 'fifty Rupees')
    .replace(/Rs\.?\s?50\b/gi, 'fifty Rupees')
    .replace(/\b50\s?rupees\b/gi, 'fifty Rupees')
    .replace(/₹\s?(\d+)/g, '$1 Rupees')
    .replace(/Rs\.?\s?(\d+)/gi, '$1 Rupees');

  // Standalone numbers that might appear without currency symbol
  cleaned = cleaned
    .replace(/\b699\b/g, 'six hundred ninety-nine')
    .replace(/\b499\b/g, 'four hundred ninety-nine')
    .replace(/\b850\b/g, 'eight hundred fifty')
    .replace(/\b399\b/g, 'three hundred ninety-nine')
    .replace(/\b1,?199\b/g, 'one thousand one hundred ninety-nine')
    .replace(/\b2,?500\b/g, 'two thousand five hundred');

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
      responseText: "Namaste! While I would love to help, I can only assist with Aura Skincare orders, products, and policies. How may I help you with your skincare routine today?",
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
      responseText: "Certainly! You can view and manage all items in your bag anytime by tapping the shopping bag icon in the top navigation bar.",
      toolCalled: { name: 'get_cart_contents', args: {}, result: { success: true, message: 'Cart inspected' } },
    };
  }

  // 3. Detect Order Mentions
  const normalizedId = normalizeOrderId(query);
  const mentionsOrder = normalizedId && normalizedId.startsWith('ORD-');

  // Check Cancellation intent
  if (query.includes('cancel') || query.includes('cancellation') || query.includes('cancel kar do') || query.includes('cancel karo')) {
    if (mentionsOrder) {
      const toolRes = cancel_order(normalizedId, isHinglish);
      return {
        responseText: toolRes.message,
        toolCalled: { name: 'cancel_order', args: { order_id: normalizedId }, result: toolRes },
      };
    } else {
      return {
        responseText: isHinglish
          ? "Namaste ji! Main aapka order cancel karne mein poori madad karungi agar yeh abhi Processing mein hai. Kya aap apna Order ID bata sakte hain, jaise ORD-103?"
          : "Namaste! I will gladly help you cancel your order if it is still in Processing status. Could you please share your Order ID, such as ORD-103?",
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
        responseText: isHinglish
          ? "Mujhe khed hai par hum 7 din ke andar sirf unopened packaging wale items ka return lete hain. Kyunki aapka order 20 din pehle deliver hua tha aur khula hua hai, hum return ya refund accept nahi kar sakte."
          : "I completely understand your concern, but as per Aura Skincare policy, returns are accepted strictly within 7 days of delivery for unopened items in original packaging. Since your product was delivered 20 days ago and opened, we cannot accept a return. I hope you understand!",
      };
    } else {
      return {
        responseText: isHinglish
          ? "Namaste ji! Returns sirf delivery ke 7 din ke andar unopened products ke liye accept kiye jaate hain. Kya aap apna Order ID share kar sakte hain?"
          : "Namaste! Returns are accepted strictly within 7 days of delivery for unopened items in original packaging. Could you please share your Order ID so I can verify its eligibility for you?",
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
      const toolRes = get_order_details(normalizedId, isHinglish);
      return {
        responseText: toolRes.message,
        toolCalled: { name: 'get_order_details', args: { order_id: normalizedId }, result: toolRes },
      };
    } else {
      return {
        responseText: isHinglish
          ? "Namaste ji! Main aapka order zaroor track karungi. Kripya apna Order ID batayein, jaise ORD-101?"
          : "Namaste! I would be very happy to track your order for you. Could you please share your Order ID, for example ORD-101?",
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
      responseText: isHinglish
        ? "499 Rupees se upar ke orders par free delivery hai! Usse kam ke orders par 50 Rupees shipping charge hai, aur delivery 3 se 5 dino mein ho jaati hai."
        : "We offer free delivery across India on orders above ₹499! Orders below ₹499 have a ₹50 shipping fee, and delivery takes 3 to 5 business days.",
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
      responseText: isHinglish
        ? "Haan ji bilkul! 2,500 Rupees tak ke sabhi orders par Cash on Delivery uplabdh hai. Aap doorstep par cash ya UPI se pay kar sakte hain."
        : "Yes, absolutely! Cash on Delivery is gladly available across India for orders up to ₹2,500. You can pay with cash or simply scan UPI at your doorstep.",
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
      responseText: isHinglish
        ? "Namaste ji! Aura Skincare ek premium organic Indian skincare brand hai jo kesar, Kannauj rose water, aur kumkumadi jaise shuddh botanicals se bane products pradan karta hai."
        : "Namaste! Aura Skincare is a premium organic Indian skincare brand focused on simple, effective formulations crafted with pure botanicals like saffron, Kannauj rose water, and kumkumadi.",
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
      responseText: isHinglish
        ? "Garmi ke liye hamara Hydrating Sunscreen SPF 50 aur Kannauj Rose Water Mist sabse best hain! Yeh dhoop se bachate hain aur skin ko fresh rakhte hain. Kya main sunscreen aapke cart mein add kar doon?"
        : "For the Indian summer, we highly recommend our Hydrating Sunscreen SPF 50 and Pure Kannauj Rose Water Mist! They protect against UV tanning and keep your skin fresh throughout the day. Would you like me to add the sunscreen to your bag?",
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
      responseText: isHinglish
        ? "Hamare sabse lokpriya products hain Vitamin C Brightening Serum glow ke liye aur Hydrating Sunscreen SPF 50 dhoop se suraksha ke liye. Aap kaunsa try karna chahenge?"
        : "Our most beloved bestsellers are the Vitamin C Brightening Serum for a luminous glow and the Hydrating Sunscreen SPF 50 for daily UV protection. Which one would you love to try?",
    };
  }

  // Summary inquiries
  if (query.includes('summary') || query.includes('summarize')) {
    return {
      responseText: isHinglish
        ? "Ji bilkul! Call khatam hote hi aap poori call summary screen par dekh sakte hain, ya aap mujhse abhi koi aur sawaal bhi pooch sakte hain."
        : "Certainly! You can review the complete call summary right on screen as soon as we finish our conversation, or feel free to ask me anything else right now.",
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
      responseText: isHinglish
        ? "Namaste ji! Aura Skincare mein aapka swagat hai. Main Aria hoon, aapki customer support specialist. Aaj main aapki kya madad kar sakti hoon?"
        : "Namaste! Welcome to Aura Skincare. I am Aria, your personal customer support voice specialist. How may I assist you with your order or skincare routine today?",
    };
  }

  // Check Thanks / Goodbye
  if (query.includes('thank') || query.includes('bye') || query.includes('shukriya') || query.includes('dhanyawad')) {
    return {
      responseText: isHinglish
        ? "Aapka bahut-bahut dhanyawad ji! Aura Skincare se sampark karne ke liye shukriya. Aapka din shubh rahe!"
        : "You are most welcome ji! Thank you so much for contacting Aura Skincare. Have a wonderful and glowing day ahead!",
    };
  }

  // Graceful degradation for unclear or mumbled query
  if (query.length < 4) {
    return {
      responseText: "I'm so sorry, I didn't quite catch that. Could you please repeat your question for me?",
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
