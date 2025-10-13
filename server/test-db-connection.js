// Test database connection and configuration
import { PrismaClient } from '@prisma/client';
import { ENV } from './dist/env.js';

console.log('🔍 Testing Database Connection...');
console.log('Environment:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL preview:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : 'NOT SET');
console.log('Full DATABASE_URL:', process.env.DATABASE_URL);

// Import the configured Prisma client
import { prisma } from './dist/prisma.js';

async function testConnection() {
  try {
    console.log('📡 Attempting to connect to database...');
    await prisma.$connect();
    console.log('✅ Connected successfully!');
    
    console.log('🔍 Testing simple query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query result:', result);
    
    console.log('🔍 Testing table existence...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'L%'
      ORDER BY table_name
    `;
    console.log('✅ Available tables:', tables);
    
    console.log('🔍 Testing L1 table...');
    const l1Count = await prisma.l1OperationalInput.count();
    console.log('✅ L1 records count:', l1Count);
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database');
  }
}

testConnection();
