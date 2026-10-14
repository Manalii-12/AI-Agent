import { NextRequest, NextResponse } from 'next/server';
import { generateStructuredSummary } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript, apiKey: clientApiKey, provider = 'groq' } = body;

    const apiKey = clientApiKey || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

    // If API key is present, we can optionally use LLM for summarization
    if (apiKey && transcript && transcript.length > 0) {
      try {
        const isGroq = provider === 'groq' || apiKey.startsWith('gsk_');
        const endpoint = isGroq
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';
        const model = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

        const conversationText = transcript
          .map((m: any) => `${m.sender.toUpperCase()}: ${m.text}`)
          .join('\n');

        const prompt = `
Analyze the following customer support call between a customer and Aria (support specialist for Aura Skincare):
${conversationText}

Extract and return a valid JSON object matching EXACTLY this schema:
{
  "customer_intent": "ORDER_TRACKING" | "RETURN_REQUEST" | "CANCELLATION" | "SHIPPING_INQUIRY" | "PAYMENT_COD_INQUIRY" | "PRODUCT_INQUIRY" | "OUT_OF_SCOPE" | "GENERAL_QUERY",
  "order_id": "ORD-101" or null,
  "resolution_status": "RESOLVED" | "POLICY_DENIED" | "NEEDS_FOLLOW_UP" | "UNRESOLVED",
  "call_summary": "1-2 sentence description of what the customer asked and the final outcome."
}

Return ONLY raw JSON, with no markdown code blocks or additional text.
`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const rawContent = data.choices?.[0]?.message?.content?.trim();
          const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          return NextResponse.json({ summary: parsed, source: 'cloud_llm' });
        }
      } catch (err) {
        console.warn('External LLM summary failed, using structured summary generator:', err);
      }
    }

    // Default fast structured summary generator
    const summary = generateStructuredSummary(transcript || []);
    return NextResponse.json({ summary, source: 'local_engine' });
  } catch (error: any) {
    console.error('Summary API Error:', error);
    return NextResponse.json(
      {
        error: error.message,
        summary: generateStructuredSummary([]),
      },
      { status: 500 }
    );
  }
}
