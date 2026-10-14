import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT, processLocalVoiceQuery } from '@/lib/llm';
import { TOOL_DEFINITIONS, get_order_details, cancel_order, check_return_eligibility } from '@/lib/tools';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, apiKey: clientApiKey, provider = 'groq' } = body;

    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage?.text || lastMessage?.content || '';

    // Check for API key in client settings or environment variables
    const apiKey = clientApiKey || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

    // If an API key is available, call the real LLM with function calling
    if (apiKey) {
      try {
        const isGroq = provider === 'groq' || apiKey.startsWith('gsk_');
        const endpoint = isGroq
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';
        const model = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

        // Prepare conversation format for OpenAI/Groq API
        const formattedMessages = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map((m: any) => ({
            role: m.sender === 'agent' ? 'assistant' : m.sender === 'user' ? 'user' : 'system',
            content: m.text || m.content || '',
          })),
        ];

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: formattedMessages,
            tools: TOOL_DEFINITIONS,
            tool_choice: 'auto',
            temperature: 0.3,
            max_tokens: 250,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const choice = data.choices?.[0];
          const message = choice?.message;

          // Check if LLM requested a tool call
          if (message?.tool_calls && message.tool_calls.length > 0) {
            const toolCall = message.tool_calls[0];
            const fnName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments || '{}');

            let toolResult: any;
            if (fnName === 'get_order_details') {
              toolResult = get_order_details(args.order_id);
            } else if (fnName === 'cancel_order') {
              toolResult = cancel_order(args.order_id);
            } else if (fnName === 'check_return_eligibility') {
              toolResult = check_return_eligibility(args.order_id, args.is_opened, args.is_damaged);
            }

            // Make second call with tool response so LLM can synthesize natural response
            const followUpMessages = [
              ...formattedMessages,
              message,
              {
                role: 'tool',
                tool_call_id: toolCall.id,
                name: fnName,
                content: JSON.stringify(toolResult),
              },
            ];

            const secondResponse = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model,
                messages: followUpMessages,
                temperature: 0.3,
                max_tokens: 200,
              }),
            });

            if (secondResponse.ok) {
              const secondData = await secondResponse.json();
              const finalContent = secondData.choices?.[0]?.message?.content || toolResult.message;
              return NextResponse.json({
                response: finalContent,
                toolCalled: { name: fnName, args, result: toolResult },
                source: 'cloud_llm',
              });
            } else {
              // Return tool message directly if follow-up fails
              return NextResponse.json({
                response: toolResult.message,
                toolCalled: { name: fnName, args, result: toolResult },
                source: 'cloud_llm_tool_fallback',
              });
            }
          }

          if (message?.content) {
            return NextResponse.json({
              response: message.content,
              source: 'cloud_llm',
            });
          }
        }
      } catch (err) {
        console.warn('External LLM call failed, falling back to local engine:', err);
      }
    }

    // Default High-Precision Local Intent Engine
    const localResult = processLocalVoiceQuery(userText, messages);
    return NextResponse.json({
      response: localResult.responseText,
      toolCalled: localResult.toolCalled,
      source: 'local_engine',
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      {
        response: "I'm having a slight trouble hearing you clearly. Could you please repeat that?",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
