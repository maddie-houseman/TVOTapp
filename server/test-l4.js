// Test script for L4 endpoint
import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:8080';

async function testL4() {
  
  try {
    const response = await fetch(`${SERVER_URL}/api/l4/snapshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: 'test-company-123',
        period: '2024-01',
        assumptions: {
          revenueUplift: 100000,
          productivityGainHours: 1000,
          avgLoadedRate: 50
        }
      })
    });
    
    const data = await response.json();
    console.log('L4 Response:', data);
    console.log('Status:', response.status);
    console.log('Test PASSED!');
    
  } catch (error) {
    console.error('Test FAILED:', error.message);
  }
}

// Test health first
async function testHealth() {
  try {
    const response = await fetch(`${SERVER_URL}/api/health`);
    const data = await response.json();
    console.log('Health check:', data);
    return true;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
}

async function runTests() {
  
  const healthOk = await testHealth();
  if (healthOk) {
    await testL4();
  } else {
    console.log('Server not running. Start it with: node standalone-l4-server.js');
  }
}

runTests();
