/**
 * Seed gói Premium tháng (49.000đ) đã thanh toán cho 24 user ở hàng 25-48
 * trong file D:\md_to_excel\Users_formatted.xlsx.
 *
 * Mỗi user sẽ có:
 *  - 1 Payment: planId "monthly", amount 49000, status "paid", paidAt trong 14 ngày gần nhất
 *  - Tài khoản được bật isPremium + premiumExpiry (+30 ngày, cộng dồn nếu còn hạn)
 *
 * Chạy:  node prisma/seed-subscriptions.mjs
 *        node prisma/seed-subscriptions.mjs --force   (tạo thêm dù đã có gói tháng)
 */
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { randomInt } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

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

// Excel rows 25-48 (Users_formatted.xlsx)
const TARGET_EMAILS = [
  'dqminh279@gmail.com',              // 25. Dương Quốc Minh
  'khai580vu@gmail.com',              // 26. Vũ Đình Khải
  'hungvo99@gmail.com',               // 27. Võ Thanh Hùng
  'thinhtran03@gmail.com',            // 28. Trần Quang Thịnh (đã VIP)
  'Trannguyetanhduong1192@gmail.com', // 29. Anh Duong
  'quantran03@gmail.com',             // 30. Trần Quân
  'anh.pham2005@gmail.com',           // 31. Phạm Xuân Anh (đã VIP)
  'khoa.tran2006@gmail.com',          // 32. Trần Khoa
  'ly295ho@gmail.com',                // 33. Hồ Gia Ly
  'vqhoang247@gmail.com',             // 34. Vũ Quốc Hoàng
  'ly350le@gmail.com',                // 35. Lê Hữu Ly
  'dtlinh451@gmail.com',              // 36. Đỗ Thanh Linh
  'trang153dang@gmail.com',           // 37. Đặng Minh Trang
  'hieuly05@gmail.com',               // 38. Lê Xuân Hiếu
  'thaobui06@gmail.com',              // 39. Bùi Thảo
  'yenhuynh02@gmail.com',             // 40. Huỳnh Trọng Yến
  'dung.trinh2004@gmail.com',         // 41. Trịnh Khánh Dung
  'dung.nguyen2002@gmail.com',        // 42. Nguyễn Hữu Dũng
  'minh.ngo2003@gmail.com',           // 43. Ngô Đức Minh
  'phuongly04@gmail.com',             // 44. Lý Hữu Phương
  'cuongdo00@gmail.com',              // 45. Đỗ Đình Cường
  'phlong956@gmail.com',              // 46. Phạm Hữu Long
  'kientran06@gmail.com',             // 47. Trần Văn Kiên
  'hang.nguyen2000@gmail.com',        // 48. Nguyễn Thị Hằng
];

const PLAN = { planId: 'monthly', amount: 49000, durationDays: 30 };
const DAY_MS = 24 * 60 * 60 * 1000;

async function generateOrderCode(prisma) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const orderCode = randomInt(100000000, 999999999);
    const exists = await prisma.payment.findUnique({ where: { orderCode } });
    if (!exists) return orderCode;
  }
  throw new Error('Không tạo được orderCode duy nhất');
}

// Giờ quyết toán ngẫu nhiên trong 14 ngày gần nhất, giờ 07:00 - 22:59
function randomPaidAt(daysBack = 14) {
  const d = new Date(Date.now() - randomInt(0, daysBack + 1) * DAY_MS);
  d.setHours(randomInt(7, 23), randomInt(0, 60), randomInt(0, 60), 0);
  return d;
}

async function main() {
  const force = process.argv.includes('--force');
  const retime = process.argv.includes('--retime');
  const prisma = new PrismaClient();

  try {
    const users = await prisma.user.findMany({
      where: { email: { in: TARGET_EMAILS } },
      select: { id: true, email: true, name: true, isPremium: true, premiumExpiry: true },
    });

    const foundEmails = new Set(users.map((u) => u.email.toLowerCase()));
    const missing = TARGET_EMAILS.filter((e) => !foundEmails.has(e.toLowerCase()));
    if (missing.length) {
      console.warn('⚠ Không tìm thấy user:', missing.join(', '));
    }

    // --retime: chỉ đổi thời điểm quyết toán của các đơn đã tạo
    if (retime) {
      const userIds = users.map((u) => u.id);
      const payments = await prisma.payment.findMany({
        where: { userId: { in: userIds }, status: 'paid' },
        orderBy: { createdAt: 'asc' },
      });

      for (const p of payments) {
        const paidAt = randomPaidAt();
        await prisma.payment.update({
          where: { id: p.id },
          data: { paidAt, createdAt: paidAt },
        });
        console.log(`  ✓ #${p.orderCode}: ${paidAt.toLocaleString('vi-VN')}`);
      }

      console.log(`\nĐã đổi thời gian quyết toán cho ${payments.length} giao dịch.`);
      return;
    }

    let paymentsCreated = 0;
    let upgraded = 0;
    let skipped = 0;

    for (const email of TARGET_EMAILS) {
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) continue;

      if (!force) {
        const existing = await prisma.payment.findFirst({
          where: { userId: user.id, planId: PLAN.planId, status: 'paid' },
        });
        if (existing) {
          console.log(`  - ${user.name} <${user.email}>: đã có gói tháng, bỏ qua.`);
          skipped++;
          continue;
        }
      }

      const orderCode = await generateOrderCode(prisma);
      const paidAt = randomPaidAt();

      // Cộng dồn thời hạn giống logic webhook PayOS
      const now = new Date();
      const base =
        user.isPremium && user.premiumExpiry && user.premiumExpiry > now
          ? user.premiumExpiry
          : now;
      const premiumExpiry = new Date(base.getTime() + PLAN.durationDays * DAY_MS);

      await prisma.$transaction([
        prisma.payment.create({
          data: {
            orderCode,
            userId: user.id,
            planId: PLAN.planId,
            amount: PLAN.amount,
            status: 'paid',
            payosTransactionId: `PAYOS${orderCode}`,
            paymentLink: null,
            createdAt: paidAt,
            paidAt,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { isPremium: true, premiumExpiry },
        }),
      ]);

      paymentsCreated++;
      upgraded += user.isPremium ? 0 : 1;
      console.log(
        `  ✓ ${user.name} <${user.email}>: thanh toán ${PLAN.amount.toLocaleString('vi-VN')}đ — VIP đến ${premiumExpiry.toLocaleDateString('vi-VN')}`
      );
    }

    const [totalPaid, revenue, vipCount] = await Promise.all([
      prisma.payment.count({ where: { status: 'paid' } }),
      prisma.payment.aggregate({ where: { status: 'paid' }, _sum: { amount: true } }),
      prisma.user.count({ where: { isPremium: true } }),
    ]);

    console.log('\n=== Hoàn tất ===');
    console.log(`Payment mới tạo   : ${paymentsCreated}`);
    console.log(`User lên VIP mới  : ${upgraded} (bỏ qua: ${skipped})`);
    console.log(`Tổng đơn đã trả   : ${totalPaid}`);
    console.log(`Tổng doanh thu    : ${(revenue._sum.amount || 0).toLocaleString('vi-VN')}đ`);
    console.log(`Tổng user VIP     : ${vipCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Seed lỗi:', err);
  process.exit(1);
});
