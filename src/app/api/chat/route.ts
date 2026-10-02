import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { z } from 'zod';
import prisma from '@/lib/prisma';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json();
    console.log("Received messages count:", messages.length);

    const result = await streamText({
      model: google('gemini-3.5-flash-lite'),
      messages,
      system: `You are Focus Mate AI, a helpful and polite AI assistant built into the application.
When a user asks for a study plan, schedule, or advice on time management, you should generate a schedule and AUTOMATICALLY use the 'schedule_study_blocks' tool to save the plan directly to their AI Planner account.
You do NOT need to ask for their permission first. Always call the tool immediately when you suggest a schedule, and then inform them that you have automatically added it to their AI Planner.
CRITICAL INSTRUCTION: You MUST actually execute the 'schedule_study_blocks' tool. Do NOT just write text claiming you saved it. If you generate a schedule, you MUST call the tool.`,
      tools: {
        schedule_study_blocks: {
          description: 'Save study blocks to the user\'s AI Planner',
          parameters: z.object({
            blocks: z.array(z.object({
              title: z.string().describe('Title of the study block, e.g., "Học Toán"'),
              date: z.string().describe('Date in YYYY-MM-DD format'),
              startTime: z.string().describe('Start time in HH:mm format'),
              endTime: z.string().describe('End time in HH:mm format'),
              type: z.string().describe('Type of block, usually "ai_suggested" or "study"'),
            }))
          }),
          execute: async ({ blocks }) => {
            if (!userId) {
              return { error: "User is not logged in." };
            }
            try {
              const createdBlocks = await Promise.all(
                blocks.map((block) => 
                  prisma.plannerBlock.create({
                    data: {
                      userId,
                      title: block.title,
                      date: new Date(block.date),
                      startTime: block.startTime,
                      endTime: block.endTime,
                      type: block.type,
                      status: "pending"
                    }
                  })
                )
              );
              
              const formattedBlocks = createdBlocks.map(b => {
                const [sh, sm] = b.startTime.split(':').map(Number);
                const [eh, em] = b.endTime.split(':').map(Number);
                const durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
                
                return {
                  id: b.id,
                  deadlineId: b.relatedDeadlineId || "ai-generated",
                  taskName: b.title,
                  date: b.date.toISOString().split('T')[0],
                  startTime: b.startTime,
                  endTime: b.endTime,
                  durationMinutes,
                  explanation: "Lịch do AI sắp xếp",
                  status: b.status,
                  urgencyScore: 5,
                  isBuffer: false
                };
              });

              return { success: true, message: `Successfully scheduled ${createdBlocks.length} study blocks!`, blocks: formattedBlocks };
            } catch (error: any) {
              return { error: `Error saving blocks: ${error.message}` };
            }
          }
        }
      },
      maxSteps: 5,
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

