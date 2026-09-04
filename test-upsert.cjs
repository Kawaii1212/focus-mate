const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = 'd71e95c8-9ce6-4112-92d9-582a3596eacd';
  const roomId = '1788105067424';
  
  try {
    const result = await prisma.roomMember.upsert({
      where: { id: userId },
      update: { roomId, name: 'Test', mascotPersonaId: 'kiwi', lastCheckIn: new Date() },
      create: { id: userId, roomId, name: 'Test', mascotPersonaId: 'kiwi' }
    });
    console.log("Upsert result:", result);
  } catch (err) {
    console.error("Upsert error:", err);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
