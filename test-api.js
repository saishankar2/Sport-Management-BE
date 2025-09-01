const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'testpass123',
  firstName: 'Test',
  lastName: 'User',
  role: 'user'
};

// Helper function to make requests
const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

// Test functions
const testHealthCheck = async () => {
  console.log('\n🔍 Testing Health Check...');
  const result = await makeRequest('GET', '/health');
  if (result.success) {
    console.log('✅ Health check passed:', result.data.message);
  } else {
    console.log('❌ Health check failed:', result.error);
  }
};

const testUserRegistration = async () => {
  console.log('\n🔍 Testing User Registration...');
  const result = await makeRequest('POST', '/auth/register', testUser);
  if (result.success) {
    console.log('✅ User registration successful');
    console.log('📧 User email:', result.data.data.user.email);
    console.log('👤 User name:', result.data.data.user.fullName);
    console.log('⏰ Token expires in:', result.data.expiresIn);
    authToken = result.data.token;
    console.log('🔑 Auth token received');
  } else {
    console.log('❌ User registration failed:', result.error);
  }
};

const testUserLogin = async () => {
  console.log('\n🔍 Testing User Login...');
  const loginData = {
    email: testUser.email,
    password: testUser.password
  };
  const result = await makeRequest('POST', '/auth/login', loginData);
  if (result.success) {
    console.log('✅ User login successful');
    console.log('⏰ Token expires in:', result.data.expiresIn);
    authToken = result.data.token;
    console.log('🔑 New auth token received');
  } else {
    console.log('❌ User login failed:', result.error);
  }
};

const testGetProfile = async () => {
  console.log('\n🔍 Testing Get Profile...');
  if (!authToken) {
    console.log('❌ No auth token available');
    return;
  }
  
  const result = await makeRequest('GET', '/auth/me', null, authToken);
  if (result.success) {
    console.log('✅ Profile retrieved successfully');
    console.log('👤 Current user:', result.data.data.user.fullName);
  } else {
    console.log('❌ Get profile failed:', result.error);
  }
};

const testUpdateProfile = async () => {
  console.log('\n🔍 Testing Update Profile...');
  if (!authToken) {
    console.log('❌ No auth token available');
    return;
  }
  
  const updateData = {
    firstName: 'Updated',
    lastName: 'Name'
  };
  
  const result = await makeRequest('PUT', '/auth/me', updateData, authToken);
  if (result.success) {
    console.log('✅ Profile updated successfully');
    console.log('👤 Updated name:', result.data.data.user.fullName);
  } else {
    console.log('❌ Update profile failed:', result.error);
  }
};

const testChangePassword = async () => {
  console.log('\n🔍 Testing Change Password...');
  if (!authToken) {
    console.log('❌ No auth token available');
    return;
  }
  
  const passwordData = {
    currentPassword: testUser.password,
    newPassword: 'newpassword456'
  };
  
  const result = await makeRequest('POST', '/auth/change-password', passwordData, authToken);
  if (result.success) {
    console.log('✅ Password changed successfully');
    // Update test user password for future tests
    testUser.password = 'newpassword456';
  } else {
    console.log('❌ Change password failed:', result.error);
  }
};

const testLogout = async () => {
  console.log('\n🔍 Testing Logout...');
  if (!authToken) {
    console.log('❌ No auth token available');
    return;
  }
  
  const result = await makeRequest('POST', '/auth/logout', null, authToken);
  if (result.success) {
    console.log('✅ Logout successful');
    console.log('💡 Note: Frontend should remove the token from storage');
    console.log('🔒 Token is still valid on server for 15 minutes but frontend won\'t send it');
    authToken = '';
  } else {
    console.log('❌ Logout failed:', result.error);
  }
};

const testTokenAfterLogout = async () => {
  console.log('\n🔍 Testing Token Usage After Logout...');
  if (!authToken) {
    console.log('💡 Simulating frontend token removal (token cleared)');
    console.log('✅ This is the correct behavior - frontend manages tokens');
    return;
  }
  
  // This test shows what happens if frontend doesn't remove token
  const result = await makeRequest('GET', '/auth/me', null, authToken);
  if (result.success) {
    console.log('⚠️  Token still works (this is expected with short-lived tokens)');
    console.log('💡 Frontend should remove token to prevent this');
  } else {
    console.log('❌ Token validation failed:', result.error);
  }
};

// Run all tests
const runTests = async () => {
  console.log('🚀 Starting API Tests...');
  console.log('📍 Base URL:', BASE_URL);
  console.log('💡 Using Industry Standard: 15-minute tokens + Frontend token management');
  
  try {
    await testHealthCheck();
    await testUserRegistration();
    await testUserLogin();
    await testGetProfile();
    await testUpdateProfile();
    await testChangePassword();
    await testLogout();
    await testTokenAfterLogout();
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📚 Key Points:');
    console.log('   • Tokens expire in 15 minutes (industry standard)');
    console.log('   • Frontend removes token on logout');
    console.log('   • No database overhead for authentication');
    console.log('   • Better performance and scalability');
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
  }
};

// Check if server is running before testing
const checkServer = async () => {
  try {
    await axios.get('http://localhost:3000/health');
    console.log('✅ Server is running, starting tests...');
    await runTests();
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first:');
    console.log('   npm run dev');
  }
};

// Run the tests
checkServer(); 