/**
 * Seed thêm N người dùng Free giả lập (mặc định 200), kèm mascot + phiên học + deadline.
 *
 * Chạy:  node prisma/seed-users.mjs
 *        node prisma/seed-users.mjs --count 50
 *        node prisma/seed-users.mjs --password 123456
 *
 * Dữ liệu tham khảo cấu trúc từ D:\md_to_excel\Users_formatted.xlsx
 * (id, name, email, passwordHash, onboardingComplete, studyHabit, goal,
 *  preferredTime, createdAt, isPremium, premiumExpiry)
 */
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { randomInt, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Nạp .env
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
// Cấu hình
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const argValue = (flag, fallback) => {
  const i = argv.indexOf(flag);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const COUNT = Math.max(1, parseInt(argValue('--count', '200'), 10) || 200);
const PASSWORD = argValue('--password', '123456');

const PERSONAS = [
  { id: '0', name: 'Mochi' },
  { id: '1', name: 'Zappy' },
  { id: '2', name: 'Sage' },
  { id: '3', name: 'Pearl' },
  { id: '4', name: 'Blaze' },
  { id: '5', name: 'Rex' },
];

const SURNAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const MIDDLES = ['Văn', 'Thị', 'Minh', 'Quang', 'Hữu', 'Thanh', 'Ngọc', 'Gia', 'Bảo', 'Thu', 'Hải', 'Khánh', 'Anh', 'Đức'];
const GIVENS = ['An', 'Bình', 'Châu', 'Dũng', 'Hà', 'Hải', 'Hiếu', 'Hoa', 'Hùng', 'Hương', 'Khang', 'Lan', 'Linh', 'Long', 'Mai', 'Nam', 'Nga', 'Ngân', 'Nhi', 'Phong', 'Phúc', 'Quân', 'Quỳnh', 'Sơn', 'Tâm', 'Thảo', 'Thắng', 'Trang', 'Trung', 'Tú', 'Vy', 'Yến', 'Khoa', 'My', 'Nhung', 'Thư', 'Vinh', 'Đạt', 'Hạnh', 'Kiên'];
const DOMAINS = ['gmail.com', 'gmail.com', 'gmail.com', 'gmail.com', 'fpt.edu.vn', 'outlook.com'];

const TASK_TITLES = [
  'Ôn tập Toán Giải Tích',
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
const HABITS = ['Pomodoro', 'Pomodoro', 'Deep Work', 'Time Blocking'];
const GOALS = ['Tập trung học tập', 'Thi đỗ đại học', 'Hoàn thành luận văn', 'Cải thiện tiếng Anh', 'Xây dựng thói quen học'];

const randInt = (min, max) => randomInt(min, max + 1);
const pick = (arr) => arr[randomInt(0, arr.length)];

function toSlug(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function getMascotStage(level) {
  if (level < 10) return 'baby';
  if (level < 30) return 'teen';
  return 'adult';
}

function buildSessions(count) {
  return Array.from({ length: count }, () => {
    const target = pick(TARGET_MINUTES);
    const actual = Math.max(5, Math.round(target * (0.7 + Math.random() * 0.45)));
    const pct = Math.min(100, Math.round((actual / target) * 100));
    const d = new Date(Date.now() - randInt(0, 60) * 24 * 60 * 60 * 1000);
    return {
      id: randomUUID(),
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
  });
}

function buildDeadlines(count) {
  return Array.from({ length: count }, () => {
    const d = new Date(Date.now() + randInt(-10, 90) * 24 * 60 * 60 * 1000);
    return {
      id: randomUUID(),
      title: pick(DEADLINE_TITLES),
      date: d,
      importance: pick(IMPORTANCE),
      isCompleted: Math.random() < 0.15,
      estimatedHours: randomInt(1, 9),
    };
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const prisma = new PrismaClient();

  try {
    const existing = await prisma.user.findMany({ select: { email: true } });
    const usedEmails = new Set(existing.map((u) => u.email.toLowerCase()));

    const users = [];
    let guard = 0;

    while (users.length < COUNT && guard < COUNT * 50) {
      guard++;
      const name = `${pick(SURNAMES)} ${pick(MIDDLES)} ${pick(GIVENS)}`;
      const base = toSlug(name.replace(/\s+/g, '.'));
      let email = `${base}@${pick(DOMAINS)}`;

      if (usedEmails.has(email.toLowerCase())) {
        email = `${base}${randInt(1, 9999)}@${pick(DOMAINS)}`;
      }
      if (usedEmails.has(email.toLowerCase())) continue;

      usedEmails.add(email.toLowerCase());

      const level = randInt(1, 9);
      const persona = pick(PERSONAS);
      const createdAt = new Date(Date.now() - randInt(0, 60) * 24 * 60 * 60 * 1000);

      users.push({
        id: randomUUID(),
        name,
        email,
        passwordHash: PASSWORD,
        onboardingComplete: true,
        studyHabit: pick(HABITS),
        goal: pick(GOALS),
        preferredTime: 'evening',
        isPremium: false,
        premiumExpiry: null,
        role: 'user',
        createdAt,
        mascot: {
          create: {
            personaId: persona.id,
            name: persona.name,
            stage: getMascotStage(level),
            level,
            exp: randInt(0, 100),
            expToNextLevel: 100,
            coin: randInt(50, 501),
            energy: 100,
            streakShields: randInt(1, 4),
          },
        },
        sessions: { create: buildSessions(randInt(2, 10)) },
        deadlines: { create: buildDeadlines(randInt(1, 3)) },
      });
    }

    console.log(`Chuẩn bị tạo ${users.length} user Free...`);

    let created = 0;
    const chunkSize = 25;
    for (let i = 0; i < users.length; i += chunkSize) {
      const chunk = users.slice(i, i + chunkSize);
      const results = await Promise.all(
        chunk.map((data) => prisma.user.create({ data }).catch((err) => {
          console.error(`  ! bỏ qua ${data.email}: ${err.code || err.message}`);
          return null;
        }))
      );
      created += results.filter(Boolean).length;
      console.log(`  - ${Math.min(i + chunkSize, users.length)}/${users.length} user đã xử lý`);
    }

    const totalUsers = await prisma.user.count();
    const totalFree = await prisma.user.count({ where: { isPremium: false } });

    console.log('\n=== Hoàn tất ===');
    console.log(`User mới tạo      : ${created}`);
    console.log(`Tổng user trong DB: ${totalUsers} (Free: ${totalFree})`);
    console.log(`Mật khẩu mặc định : ${PASSWORD}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Seed lỗi:', err);
  process.exit(1);
});
