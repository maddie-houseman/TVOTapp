import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log slow queries (>1000ms) and errors
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn(`[PRISMA-SLOW-QUERY] Duration: ${e.duration}ms, Query: ${e.query}, Params: ${e.params}`);
  }
});

prisma.$on('error', (e) => {
  console.error(`[PRISMA-ERROR] ${e.message}`);
});

prisma.$on('info', (e) => {
  console.info(`[PRISMA-INFO] ${e.message}`);
});

prisma.$on('warn', (e) => {
  console.warn(`[PRISMA-WARN] ${e.message}`);
});

// Optional: clean shutdown
process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
});
// hi