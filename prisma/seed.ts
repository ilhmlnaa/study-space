import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("password123", 12);

  // Create Admin
  await prisma.user.upsert({
    where: { email: "admin@studyspace.test" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@studyspace.test",
      password,
      role: Role.ADMIN,
    },
  });

  // Create Mentor
  await prisma.user.upsert({
    where: { email: "mentor@studyspace.test" },
    update: {},
    create: {
      name: "Mentor User",
      email: "mentor@studyspace.test",
      password,
      role: Role.MENTOR,
    },
  });

  // Create Moderator
  await prisma.user.upsert({
    where: { email: "moderator@studyspace.test" },
    update: {},
    create: {
      name: "Moderator User",
      email: "moderator@studyspace.test",
      password,
      role: Role.MODERATOR,
    },
  });

  // Create Student
  await prisma.user.upsert({
    where: { email: "student@studyspace.test" },
    update: {},
    create: {
      name: "Student User",
      email: "student@studyspace.test",
      password,
      role: Role.STUDENT,
    },
  });

  // Create dummy students
  for (let i = 1; i <= 3; i++) {
    await prisma.user.upsert({
      where: { email: `student${i}@studyspace.test` },
      update: {},
      create: {
        name: `Student ${i}`,
        email: `student${i}@studyspace.test`,
        password,
        role: Role.STUDENT,
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
