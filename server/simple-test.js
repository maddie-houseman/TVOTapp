// Simple test server to verify basic functionality
import express from 'express';

const app = express();
app.use(express.json());

// Simple test endpoint
app.post('/api/l4/snapshot', (req, res) => {
  console.log('L4 test endpoint hit!', new Date().toISOString());
  console.log('Request body:', req.body);
  
  // Immediate response
  res.json({
    id: 'test-123',
    companyId: req.body.companyId || 'test-company',
    period: req.body.period || '2024-01-01',
    totalCost: 100000,
    totalBenefit: 150000,
    roiPct: 50,
    assumptions: req.body.assumptions || {},
    createdAt: new Date()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Start server
const port = 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Simple test server running on http://localhost:${port}`);
  console.log('✅ Test L4 endpoint: POST /api/l4/snapshot');
  console.log('✅ Health check: GET /api/health');
  console.log('✅ Server started successfully!');
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  process.exit(0);
});
