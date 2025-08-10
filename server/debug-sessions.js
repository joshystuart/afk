const request = require('supertest');

async function debugTest() {
  try {
    // Simulate the same test setup
    const response = await request('http://localhost:3001')
      .post('/api/sessions')
      .send({ name: 'test-session' });

    console.log('Status:', response.status);
    console.log('Body:', JSON.stringify(response.body, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugTest();
