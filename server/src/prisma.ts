import { PrismaClient } from "@prisma/client";
import { ENV } from './env.js';

// logs for testing
function fixDatabaseUrl(url: string): string {
  console.log(' Original DATABASE_URL:', url ? `${url.substring(0, 30)}...` : 'NOT SET');
  
  // Always add SSL parameters if they're missing
  if (!url.includes('sslmode=')) {
    const separator = url.includes('?') ? '&' : '?';
    const fixedUrl = `${url}${separator}sslmode=disable&connect_timeout=10`;
    console.log('Added SSL parameters (disabled):', `${fixedUrl.substring(0, 30)}...`);
    return fixedUrl;
  }
  
  // If it's a Railway URL, ensure proper SSL configuration
  if (url.includes('railway') || url.includes('rlwy.net')) {
    const cleanUrl = url.split('?')[0];
    const fixedUrl = `${cleanUrl}?sslmode=require&connect_timeout=30&pool_timeout=30`;
    console.log('Fixed Railway DATABASE_URL:', `${fixedUrl.substring(0, 30)}...`);
    return fixedUrl;
  }
  
  return url;
}

// Create Prisma client with proper configuration
function createPrismaClient() {
  const databaseUrl = fixDatabaseUrl(ENV.DATABASE_URL);
  
  return new PrismaClient({
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
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

export const prisma = createPrismaClient();

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


process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
});
