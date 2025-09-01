import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// Optional: clean shutdown
process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
});
