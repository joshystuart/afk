const axios = require('axios');

async function testSessionCreation() {
    const baseUrl = 'http://localhost:3000';
    
    console.log('Testing session creation and listing...');
    
    try {
        // 1. Check if server is running
        console.log('\n1. Testing server connectivity...');
        const healthResponse = await axios.get(`${baseUrl}/health`);
        console.log('✓ Server is running:', healthResponse.data);
        
        // 2. List existing sessions
        console.log('\n2. Listing existing sessions...');
        const listResponse = await axios.get(`${baseUrl}/sessions`);
        console.log('Current sessions:', listResponse.data);
        
        // 3. Create a new session
        console.log('\n3. Creating new test session...');
        const createData = {
            name: 'Test Session ' + Date.now(),
            repoUrl: 'https://github.com/octocat/Hello-World.git',
            branch: 'main',
            gitUserName: 'Test User',
            gitUserEmail: 'test@example.com',
            terminalMode: 'DUAL'
        };
        
        console.log('Creating session with data:', createData);
        const createResponse = await axios.post(`${baseUrl}/sessions`, createData);
        console.log('✓ Session created:', createResponse.data);
        
        // 4. List sessions again to see if it appears
        console.log('\n4. Listing sessions after creation...');
        const listAfterResponse = await axios.get(`${baseUrl}/sessions`);
        console.log('Sessions after creation:', listAfterResponse.data);
        
        // 5. Wait a bit and check again
        console.log('\n5. Waiting 5 seconds and checking again...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const listFinalResponse = await axios.get(`${baseUrl}/sessions`);
        console.log('Final session list:', listFinalResponse.data);
        
    } catch (error) {
        console.error('Error during test:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
    }
}

testSessionCreation();