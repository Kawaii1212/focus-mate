import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.iielsrlshqedifxbyxiy:Uid810129206@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});
async function main() {
  try {
    const mascot = await prisma.mascot.upsert({
      where: { userId: "4feeaf1d-e166-4f2e-ac71-94cb3305ad98" },
      update: { personaId: 0, stage: 'baby', level: 1, exp: 0, expToNextLevel: 100, coin: 50, energy: 100, streakShields: 1, name: "Test" },
      create: { userId: "4feeaf1d-e166-4f2e-ac71-94cb3305ad98", personaId: 0, stage: 'baby', level: 1, exp: 0, expToNextLevel: 100, coin: 50, energy: 100, streakShields: 1, name: "Test" }
    });
    console.log(mascot);
  } catch (err) {
    console.error(err);
  }
}
main().finally(() => prisma.$disconnect());
