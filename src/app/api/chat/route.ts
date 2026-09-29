import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 30;
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log("Received messages:", JSON.stringify(messages, null, 2));

    // Clean up UI-specific properties from messages before passing to AI SDK
    const sanitizedMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content || (m.parts ? m.parts.map((p: any) => p.text).join('') : ''),
    }));

    const result = await streamText({
      model: google('gemini-3.5-flash-lite'),
      messages: sanitizedMessages,
      system: "You are a helpful and polite AI assistant built into the application."
    });

    return result.toUIMessageStreamResponse({
      onError: (error: any) => {
        console.error("Stream Error:", error);
        return error?.message || String(error) || "An error occurred while generating the response.";
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to process chat request." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
