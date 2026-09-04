const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const room = await prisma.activeRoom.findUnique({
    where: { id: '1788105067424' },
    include: { members: true }
  });
  console.log(JSON.stringify(room, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
