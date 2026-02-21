import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt-ts";

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create Invite Codes
  const inviteCodes = ['TESTIND', 'TESTBIZ', 'WELCOME2025'];

  for (const code of inviteCodes) {
    const invite = await prisma.inviteCode.upsert({
      where: { code },
      update: {},
      create: {
        code,
        isUsed: false,
      },
    });
    console.log(`Created invite code: ${invite.code}`);
  }

  // Create Admin User
  const adminEmail = "mr.zawmyohein@gmail.com";
  const adminPassword = await hash("password123", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Zaw Myo Hein",
      password: adminPassword,
      role: "SUPER_ADMIN",
      isEmailVerified: true,
      profile: {
        create: {
          username: "zawmyohein",
          displayName: "Zaw Myo Hein",
          bio: "System Administrator & Founder",
        }
      }
    },
  });
  
  console.log(`Created admin user: ${admin.email}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
