const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.activeRoom.deleteMany();
  console.log(`Deleted ${result.count} rooms`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
