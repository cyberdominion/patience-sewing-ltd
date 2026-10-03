const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.leadActivity.deleteMany(),
    prisma.crmNote.deleteMany(),
    prisma.followUp.deleteMany(),
    prisma.campaignClick.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.review.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.address.deleteMany(),
    prisma.retailerProfile.deleteMany(),
    prisma.retailerApplication.deleteMany(),
    prisma.contactMessage.deleteMany(),
    prisma.newsletterSubscriber.deleteMany(),
    prisma.campaign.deleteMany(),
    prisma.lead.deleteMany(),
    prisma.order.deleteMany(),
    prisma.product.deleteMany(),
    prisma.user.deleteMany({ where: { email: { not: 'admin@patiencesewing.com' } } }),
  ]);
  console.log('Demo data cleared');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());