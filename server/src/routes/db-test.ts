import { Router } from 'express';
import { prisma } from '../prisma.js';

const router = Router();

// Test database connection and operations
router.get('/db-test', async (_req, res) => {
  try {
    // Test 1: Basic connection
    await prisma.$connect();
    
    // Test 2: Count users
    const userCount = await prisma.user.count();
    
    // Test 3: Count companies
    const companyCount = await prisma.company.count();
    
    // Test 4: Get all users (to see actual data)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    
    // Test 5: Get all companies
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: 'Database connection successful!',
      data: {
        userCount,
        companyCount,
        users,
        companies,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Test creating a new company (to verify write operations)
router.post('/db-test/company', async (req, res) => {
  try {
    const { name, domain } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const company = await prisma.company.create({
      data: {
        name,
        domain: domain || null
      }
    });

    res.json({
      success: true,
      message: 'Company created successfully!',
      data: company
    });
  } catch (error) {
    console.error('Company creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Company creation failed',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
