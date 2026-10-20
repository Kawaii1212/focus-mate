/**
 * Seed dữ liệu demo cho FocusMate.
 *
 * Chạy:  node prisma/seed.mjs          → chỉ seed dữ liệu còn trống
 *        node prisma/seed.mjs --reset  → xóa & seed lại thống kê của MỌI user
 *
 * Những gì script làm:
 *  1. Mọi user đều có linh vật Mascot (persona ngẫu nhiên 0-5, tên mặc định theo persona).
 *  2. Random số phiên học (StudySession) và deadline cho từng user.
 *  3. User VIP (isPremium) được seed nhiều phiên học + deadline hơn user Free.
 */
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { randomInt, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Nạp .env (DATABASE_URL / DIRECT_URL) — Prisma cần env khi chạy standalone
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let value = m[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}
loadEnv();

const { PrismaClient } = createRequire(import.meta.url)('@prisma/client');

// ---------------------------------------------------------------------------
// Cấu hình seed
// ---------------------------------------------------------------------------
const PERSONAS = [
  { id: '0', name: 'Mochi' }, // Cáo Foxy
  { id: '1', name: 'Zappy' }, // Cú Owwly
  { id: '2', name: 'Sage' }, //  Gấu Panda
  { id: '3', name: 'Pearl' }, // Mèo Neko
  { id: '4', name: 'Blaze' }, // Thỏ BunBun
  { id: '5', name: 'Rex' }, //   Rồng Spark
];

const TASK_TITLES = [
  'Ôn tập Toán GiảI Tích',
  'Học từ vựng IELTS',
  'Lập trình Python — bài tập lớn',
  'Đọc sách "Đắc Nhân Tâm"',
  'Ôn thi giữa kỳ Hóa học',
  'Viết tiểu luận Kinh Tế Lượng',
  'Học từ vựng HSK 4',
  'Ôn tập Vật lý đại cương',
  'Luyện viết tiếng Anh',
  'Hoàn thiện bài thuyết trình',
  'Ôn tập chương trình C++',
  'Học thống kê máy tính',
];

const DEADLINE_TITLES = [
  'Nộp bài tập lớn môn Lập trình',
  'Thi giữa kỳ Toán',
  'Hoàn thiện bài tiểu luận',
  'Nộp báo cáo thực tập',
  'Deadline bài tập IELTS Writing',
  'Thi cuối kỳ Hóa học',
  'Nộp slide thuyết trình',
  'Bài kiểm tra HSK',
  'Nộp báo cáo thí nghiệm Vật lý',
  'Hoàn thành chương trình tự học',
];

const TARGET_MINUTES = [25, 45, 50, 60, 90];
const IMPORTANCE = ['low', 'medium', 'medium', 'high'];

// Khoảng phiên học / deadline ngẫu nhiên theo loại user
const RANGES = {
  free: { sessions: [2, 10], deadlines: [1, 3], level: [1, 9] },
  vip: { sessions: [15, 45], deadlines: [4, 10], level: [5, 25] },
};

const rand = ([min, max]) => randomInt(min, max + 1);
const pick = (arr) => arr[randomInt(0, arr.length)];

function getMascotStage(level) {
  if (level < 10) return 'baby';
  if (level < 30) return 'teen';
  return 'adult';
}

function buildSession(userId, dayOffset) {
  const target = pick(TARGET_MINUTES);
  const actual = Math.max(5, Math.round(target * (0.7 + Math.random() * 0.45)));
  const pct = Math.min(100, Math.round((actual / target) * 100));
  const d = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);

  return {
    id: randomUUID(),
    userId,
    taskTitle: pick(TASK_TITLES),
    targetMinutes: target,
    actualMinutes: actual,
    completionPct: pct,
    expEarned: Math.round(actual * 2),
    coinEarned: Math.round(actual / 2),
    isValid: pct >= 50,
    streakSaved: pct >= 80,
    date: d.toISOString().split('T')[0],
    createdAt: d.toISOString(),
  };
}

function buildDeadline(userId, dayOffset) {
  const d = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
  return {
    id: randomUUID(),
    userId,
    title: pick(DEADLINE_TITLES),
    date: d,
    importance: pick(IMPORTANCE),
    isCompleted: Math.random() < 0.15,
    estimatedHours: randomInt(1, 9),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const reset = process.argv.includes('--reset');
  const prisma = new PrismaClient();

  try {
    const users = await prisma.user.findMany({
      include: { mascot: true, _count: { select: { sessions: true, deadlines: true } } },
    });

    console.log(`Tìm thấy ${users.length} người dùng${reset ? ' (chế độ --reset)' : ''}.`);

    let mascotsCreated = 0;
    let sessionsCreated = 0;
    let deadlinesCreated = 0;

    for (const user of users) {
      // ---- 1. Mascot: đảm bảo mọi user đều có linh vật ----
      if (!user.mascot) {
        const persona = pick(PERSONAS);
        const level = rand(RANGES[user.isPremium ? 'vip' : 'free'].level);
        await prisma.mascot.create({
          data: {
            userId: user.id,
            personaId: persona.id,
            name: persona.name,
            stage: getMascotStage(level),
            level,
            exp: randomInt(0, 100),
            expToNextLevel: 100,
            coin: randomInt(50, 501),
            energy: 100,
            streakShields: randomInt(1, 4),
          },
        });
        mascotsCreated++;
      }

      // ---- 2 & 3. Thống kê: phiên học + deadline (VIP nhiều hơn) ----
      const hasData = user._count.sessions > 0 || user._count.deadlines > 0;
      if (reset) {
        await prisma.studySession.deleteMany({ where: { userId: user.id } });
        await prisma.deadline.deleteMany({ where: { userId: user.id } });
      } else if (hasData) {
        console.log(`  - ${user.email}: đã có dữ liệu, bỏ qua (dùng --reset để seed lại).`);
        continue;
      }

      const range = RANGES[user.isPremium ? 'vip' : 'free'];
      const sessionCount = rand(range.sessions);
      const deadlineCount = rand(range.deadlines);

      if (sessionCount > 0) {
        await prisma.studySession.createMany({
          data: Array.from({ length: sessionCount }, () =>
            buildSession(user.id, randomInt(0, 60))
          ),
        });
      }

      if (deadlineCount > 0) {
        await prisma.deadline.createMany({
          data: Array.from({ length: deadlineCount }, () =>
            buildDeadline(user.id, randomInt(-10, 90))
          ),
        });
      }

      sessionsCreated += sessionCount;
      deadlinesCreated += deadlineCount;
      console.log(
        `  - ${user.email} [${user.isPremium ? 'VIP' : 'Free'}]: ${sessionCount} phiên học, ${deadlineCount} deadline.`
      );
    }

    console.log('\n=== Seed hoàn tất ===');
    console.log(`Mascot mới tạo      : ${mascotsCreated}`);
    console.log(`Phiên học mới tạo   : ${sessionsCreated}`);
    console.log(`Deadline mới tạo    : ${deadlinesCreated}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Seed lỗi:', err);
  process.exit(1);
});
