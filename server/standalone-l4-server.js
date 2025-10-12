// Standalone L4 server - completely independent
import express from 'express';
import cors from 'cors';

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

app.use(express.json());

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

// L4 Snapshot endpoint - INSTANT response
app.post('/api/l4/snapshot', (req, res) => {
  
  // INSTANT response - no delays, no database, no hanging
  const response = {
    id: 'standalone-' + Date.now(),
    companyId: req.body.companyId || 'test-company',
    period: req.body.period || '2024-01-01',
    totalCost: 100000,
    totalBenefit: 150000,
    roiPct: 50,
    assumptions: req.body.assumptions || {},
    createdAt: new Date().toISOString()
  };
  
  res.json(response);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    server: 'standalone-l4-server'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Standalone server is working!', time: new Date().toISOString() });
});

// Start server
const port = 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on: http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  process.exit(0);
});
