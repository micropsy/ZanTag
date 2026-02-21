import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getDb } from "../utils/db.server";
import { hash } from "bcrypt-ts";

import { UserRole } from "~/types";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const db = getDb(context);
  const log: string[] = [];

  try {
    // 1. Create Invite Codes
    const inviteCodes = ['TESTIND', 'TESTBIZ', 'WELCOME2025'];
    
    for (const code of inviteCodes) {
      const existing = await db.inviteCode.findUnique({ where: { code } });
      if (!existing) {
        await db.inviteCode.create({
          data: {
            code,
            isUsed: false,
          },
        });
        log.push(`Created invite code: ${code}`);
      } else {
        log.push(`Invite code exists: ${code}`);
      }
    }

    // 2. Create Admin User
    const adminEmail = "mr.zawmyohein@gmail.com";
    const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
      const adminPassword = await hash("password123", 10);
      
      // We need to create a profile as well
      await db.user.create({
        data: {
          email: adminEmail,
          name: "Zaw Myo Hein",
          password: adminPassword,
          role: UserRole.SUPER_ADMIN,
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
      log.push(`Created admin user: ${adminEmail}`);
    } else {
      log.push(`Admin user exists: ${adminEmail}`);
    }

    return json({ success: true, log });
  } catch (error) {
    console.error("Seeding error:", error);
    return json({ success: false, error: (error as Error).message }, { status: 500 });
  }
};
