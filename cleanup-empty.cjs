const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const emptyRooms = await prisma.activeRoom.findMany({
    where: { members: { none: {} } }
  });
  
  if (emptyRooms.length > 0) {
    const ids = emptyRooms.map(r => r.id);
    const result = await prisma.activeRoom.deleteMany({
      where: { id: { in: ids } }
    });
    console.log(`Deleted ${result.count} empty rooms.`);
  } else {
    console.log('No empty rooms found.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
