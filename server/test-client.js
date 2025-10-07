// Simple client test to verify server connection
import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:8080';

async function testServer() {
  console.log('🧪 Testing server connection...');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${SERVER_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test L4 endpoint
    console.log('2. Testing L4 snapshot endpoint...');
    const l4Response = await fetch(`${SERVER_URL}/api/l4/snapshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: 'test-company',
        period: '2024-01',
        assumptions: {
          revenueUplift: 100000,
          productivityGainHours: 1000,
          avgLoadedRate: 50
        }
      })
    });
    
    const l4Data = await l4Response.json();
    console.log('✅ L4 response:', l4Data);
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('❌ This means the server is not running or not accessible');
  }
}

testServer();
