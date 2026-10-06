const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'admin@patiencesewing.com' },
    select: { id: true, email: true, role: true, passwordHash: true },
  });
  console.log('Found:', !!user, user ? { email: user.email, role: user.role, hasHash: !!user.passwordHash } : null);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());