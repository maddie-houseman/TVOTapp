import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Mock L4 endpoint that works immediately
app.post('/api/l4/snapshot', (req, res) => {
  
  // Immediate response - no database, no hanging
  res.json({
    id: 'working-123',
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
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
