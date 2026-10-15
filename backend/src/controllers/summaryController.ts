import { Request, Response } from 'express';
import { prisma } from '../db';

export async function createCallSummary(req: Request, res: Response) {
  try {
    const { transcript } = req.body;

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      const emptyOutcome = {
        customerIntent: 'GENERAL_QUERY',
        orderId: null,
        resolutionStatus: 'UNRESOLVED',
        callSummary: 'Call concluded with no conversational messages exchanged.',
        transcript: [],
      };
      const saved = await prisma.callSummary.create({ data: emptyOutcome });
      return res.json({ success: true, summary: saved });
    }

    const userText = transcript
      .filter((t: any) => t.sender === 'user')
      .map((t: any) => t.text)
      .join(' ');
    const agentText = transcript
      .filter((t: any) => t.sender === 'agent')
      .map((t: any) => t.text)
      .join(' ');
    const allText = `${userText} ${agentText}`.toLowerCase();

    // 1. Detect referenced order
    let detectedOrderId: string | null = null;
    const match = allText.match(/ORD[- ]?(\d+)/i) || allText.match(/\b(10[1-9])\b/);
    if (match) {
      detectedOrderId = `ORD-${match[1]}`;
    }

    // 2. Classify intent
    let intent = 'GENERAL_QUERY';
    if (allText.includes('flight') || allText.includes('goa') || allText.includes('hotel')) {
      intent = 'OUT_OF_SCOPE';
    } else if (allText.includes('cancel')) {
      intent = 'CANCELLATION';
    } else if (allText.includes('return') || allText.includes('refund')) {
      intent = 'RETURN_REQUEST';
    } else if (detectedOrderId || allText.includes('track') || allText.includes('where is my')) {
      intent = 'ORDER_TRACKING';
    } else if (allText.includes('shipping') || allText.includes('delivery fee')) {
      intent = 'SHIPPING_INQUIRY';
    } else if (allText.includes('cod') || allText.includes('cash on delivery')) {
      intent = 'PAYMENT_COD_INQUIRY';
    } else if (allText.includes('product') || allText.includes('sunscreen') || allText.includes('summer')) {
      intent = 'PRODUCT_INQUIRY';
    }

    // 3. Classify resolution status
    let status = 'RESOLVED';
    if (intent === 'OUT_OF_SCOPE' || allText.includes('cannot be returned') || allText.includes('cannot be cancelled')) {
      status = 'POLICY_DENIED';
    }

    // 4. Synthesize summary
    let summaryText = 'Support conversation regarding Aura Skincare products and policies.';
    if (intent === 'ORDER_TRACKING' && detectedOrderId) {
      summaryText = `Customer inquired about the status of ${detectedOrderId}. Agent provided live courier tracking details.`;
    } else if (intent === 'CANCELLATION') {
      summaryText = `Customer requested cancellation for ${detectedOrderId || 'an order'}. Cancellation policy was evaluated.`;
    } else if (intent === 'RETURN_REQUEST') {
      summaryText = `Customer inquired about returns. Agent explained the 7-day unopened policy.`;
    } else if (intent === 'OUT_OF_SCOPE') {
      summaryText = `Customer asked an out-of-scope query. Agent politely redirected back to skincare support.`;
    }

    // Store in PostgreSQL database
    const saved = await prisma.callSummary.create({
      data: {
        customerIntent: intent,
        orderId: detectedOrderId,
        resolutionStatus: status,
        callSummary: summaryText,
        transcript: transcript,
      },
    });

    return res.json({
      success: true,
      summary: {
        customer_intent: saved.customerIntent,
        order_id: saved.orderId,
        resolution_status: saved.resolutionStatus,
        call_summary: saved.callSummary,
        id: saved.id,
        createdAt: saved.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error generating and saving summary:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getAllCallSummaries(req: Request, res: Response) {
  try {
    const summaries = await prisma.callSummary.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json({ success: true, data: summaries });
  } catch (error: any) {
    console.error('Error fetching summaries:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
