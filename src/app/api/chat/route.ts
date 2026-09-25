import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: google('gemini-1.5-pro'),
      messages,
      system: "You are a helpful and polite AI assistant built into the application."
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to process chat request." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
