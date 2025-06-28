// Simple test script to verify backend functionality (in-memory storage)
const API_BASE = 'http://localhost:3001/api';

async function testBackend() {
  console.log('🧪 Testing Backend API (In-Memory Storage)...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test creating a meeting
    console.log('\n2. Testing meeting creation...');
    const createResponse = await fetch(`${API_BASE}/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Meeting',
        duration: 30,
        hostName: 'Test Host'
      })
    });
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create meeting: ${createResponse.status}`);
    }
    
    const createData = await createResponse.json();
    console.log('✅ Meeting created:', createData.meeting.id);

    // Test getting the meeting
    console.log('\n3. Testing meeting retrieval...');
    const getResponse = await fetch(`${API_BASE}/meetings/${createData.meeting.id}`);
    const getData = await getResponse.json();
    console.log('✅ Meeting retrieved:', getData.meeting.title);

    // Test joining the meeting
    console.log('\n4. Testing meeting join...');
    const joinResponse = await fetch(`${API_BASE}/meetings/${createData.meeting.id}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Participant'
      })
    });
    
    const joinData = await joinResponse.json();
    console.log('✅ Participant joined:', joinData.participant.name);

    // Test getting active meetings
    console.log('\n5. Testing active meetings list...');
    const listResponse = await fetch(`${API_BASE}/meetings`);
    const listData = await listResponse.json();
    console.log('✅ Active meetings:', listData.meetings.length);

    // Test getting stats
    console.log('\n6. Testing storage stats...');
    const statsResponse = await fetch(`${API_BASE}/meetings/stats`);
    const statsData = await statsResponse.json();
    console.log('✅ Storage stats:', statsData.stats);

    console.log('\n🎉 All tests passed! Backend is working correctly.');
    console.log('\n📋 Test Summary:');
    console.log('- Health endpoint: ✅');
    console.log('- Meeting creation: ✅');
    console.log('- Meeting retrieval: ✅');
    console.log('- Meeting join: ✅');
    console.log('- Active meetings list: ✅');
    console.log('- Storage stats: ✅');
    console.log('\n💡 Note: Data will be lost when server restarts (in-memory storage)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('1. Backend server is started (npm run dev:backend)');
    console.log('2. Environment variables are set correctly');
    console.log('3. No other process is using port 3001');
  }
}

// Run the test
testBackend(); 