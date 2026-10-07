import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { z } from 'zod';
import prisma from '@/lib/prisma';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json();
    console.log("Received messages count:", messages?.length, "userId:", userId);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayOfWeek = daysOfWeek[now.getDay()];

    const systemPrompt = `You are Focus Mate AI, a helpful, polite, and smart AI study assistant in FocusMate.

Current Date Context:
- Today's date: ${todayStr} (${currentDayOfWeek})

AUTOMATIC AI PLANNER SCHEDULING RULE:
Whenever a user asks for a study plan, weekly schedule, exam prep schedule, or asks to add/schedule/fill study sessions into their AI Planner (e.g. "lên lịch học môn Toán", "tạo thời gian biểu ôn thi", "add thêm vào AI Planner cho tôi", "sắp xếp vào AI planner"):
1. You MUST generate a detailed study plan text in Vietnamese with specific days, topics, and times.
2. You MUST AUTOMATICALLY call the 'schedule_study_blocks' tool to save the plan directly to their AI Planner account. Do NOT ask for permission first.
3. In the tool call parameters, pass 'blocks': an array of objects, each containing:
   - title: Title of session (e.g. "Học Xác suất thống kê - Ngày 1")
   - date: Date string in YYYY-MM-DD format (starting from today ${todayStr})
   - startTime: Start time in HH:mm format (e.g. "08:00")
   - endTime: End time in HH:mm format (e.g. "09:30")
   - type: "ai_suggested"
4. Always call the tool immediately whenever providing a schedule or when requested to add to planner. Tell the user cheerfully that you have saved the schedule to their AI Planner!`;

    // Clean up UI-specific properties and remove empty assistant messages from history
    const sanitizedMessages = (messages || [])
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant' || m.role === 'system'))
      .map((m: any) => {
        let textContent = '';
        if (typeof m.content === 'string') {
          textContent = m.content;
        } else if (Array.isArray(m.parts)) {
          textContent = m.parts.map((p: any) => (typeof p === 'string' ? p : p.text || '')).join('');
        } else if (m.content) {
          textContent = String(m.content);
        }
        return {
          role: m.role,
          content: textContent,
        };
      })
      .filter((m: any) => m.content.trim().length > 0 || m.role === 'user');

    const result = await (streamText as any)({
      model: google('gemini-1.5-flash'),
      messages: sanitizedMessages,
      system: systemPrompt,
      tools: {
        schedule_study_blocks: {
          description: 'Save/add study blocks directly to the user\'s AI Planner',
          parameters: z.object({
            blocks: z.array(z.object({
              title: z.string().describe('Title of the study session/block, e.g., "Học Toán - Đại số"'),
              date: z.string().describe('Date in YYYY-MM-DD format (must be valid YYYY-MM-DD, e.g. 2026-10-08)'),
              startTime: z.string().describe('Start time in HH:mm format, e.g. "08:00"'),
              endTime: z.string().describe('End time in HH:mm format, e.g. "09:30"'),
              type: z.string().optional().describe('Type of block: "study", "ai_suggested", "revision", etc.'),
            }))
          }),
          execute: async ({ blocks }: any) => {
            console.log("Executing schedule_study_blocks tool. Count:", blocks?.length);
            
            let targetUserId = userId;
            if (!targetUserId) {
              const firstUser = await prisma.user.findFirst();
              targetUserId = firstUser?.id;
            }

            if (!targetUserId) {
              return { success: false, error: "Không tìm thấy người dùng để lưu lịch." };
            }

            try {
              const createdBlocks = await Promise.all(
                (blocks || []).map(async (block: any) => {
                  let blockDate = new Date(block.date);
                  if (isNaN(blockDate.getTime())) {
                    blockDate = new Date();
                  }

                  return await prisma.plannerBlock.create({
                    data: {
                      userId: targetUserId,
                      title: block.title,
                      date: blockDate,
                      startTime: block.startTime || "08:00",
                      endTime: block.endTime || "09:30",
                      type: block.type || "ai_suggested",
                      status: "pending"
                    }
                  });
                })
              );

              const formattedBlocks = createdBlocks.map(b => {
                const [sh, sm] = (b.startTime || '08:00').split(':').map(Number);
                const [eh, em] = (b.endTime || '09:30').split(':').map(Number);
                const durationMinutes = (!isNaN(sh) && !isNaN(eh)) ? Math.max(15, (eh * 60 + em) - (sh * 60 + sm)) : 60;
                
                const dateStr = b.date ? b.date.toISOString().split('T')[0] : todayStr;

                return {
                  id: b.id,
                  deadlineId: b.relatedDeadlineId || "ai-generated",
                  taskName: b.title,
                  date: dateStr,
                  startTime: b.startTime,
                  endTime: b.endTime,
                  durationMinutes,
                  explanation: "Lịch do AI tự động xếp",
                  status: b.status || 'pending',
                  urgencyScore: 5,
                  isBuffer: false
                };
              });

              return {
                success: true,
                message: `Đã tự động thêm ${createdBlocks.length} buổi học vào AI Planner của bạn!`,
                blocks: formattedBlocks
              };
            } catch (error: any) {
              console.error("Error saving planner blocks:", error);
              return { success: false, error: `Lỗi khi lưu lịch: ${error.message}` };
            }
          }
        }
      },
      maxSteps: 5,
    });

    return result.toUIMessageStreamResponse({
      onError: (error: any) => {
        console.error("Stream Error:", error);
        return error?.message || String(error) || "An error occurred while generating response.";
      },
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to process chat request: " + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

