import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding test users...");

  // Password: test123
  const hashedPassword = await bcrypt.hash("test123", 10);

  // Create USER
  const user = await prisma.user.upsert({
    where: { email: "user@test.com" },
    update: {},
    create: {
      email: "user@test.com",
      passwordHash: hashedPassword,
      role: "USER",
    },
  });
  console.log("✓ USER created:", user.email);

  // Create AGENT
  const agent = await prisma.user.upsert({
    where: { email: "agent@test.com" },
    update: {},
    create: {
      email: "agent@test.com",
      passwordHash: hashedPassword,
      role: "AGENT",
    },
  });
  console.log("✓ AGENT created:", agent.email);

  // Create ADMIN
  const admin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      passwordHash: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("✓ ADMIN created:", admin.email);

  console.log("\n📝 Test Users Created:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("USER:  user@test.com     / test123");
  console.log("AGENT: agent@test.com    / test123");
  console.log("ADMIN: admin@test.com    / test123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
