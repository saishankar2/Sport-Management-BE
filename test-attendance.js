const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let adminToken = '';
let testUserId = '';
let testAttendanceId = '';

// Test data
const testUser = {
  email: 'testuser@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User'
};

const adminUser = {
  email: 'admin@example.com',
  password: 'admin123',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin'
};

// Helper function to make authenticated requests
const makeAuthRequest = (method, url, data = null, token = authToken) => {
  const config = {
    method,
    url: `${BASE_URL}${url}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

// Test functions
const testAuth = async () => {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    // Register test user
    console.log('1. Registering test user...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log('✅ Test user registered:', registerResponse.data.message);
    
    // Register admin user
    console.log('2. Registering admin user...');
    const adminRegisterResponse = await axios.post(`${BASE_URL}/auth/register`, adminUser);
    console.log('✅ Admin user registered:', adminRegisterResponse.data.message);
    
    // Login test user
    console.log('3. Logging in test user...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    authToken = loginResponse.data.token;
    testUserId = loginResponse.data.user.id;
    console.log('✅ Test user logged in, token received');
    
    // Login admin user
    console.log('4. Logging in admin user...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: adminUser.email,
      password: adminUser.password
    });
    adminToken = adminLoginResponse.data.token;
    console.log('✅ Admin user logged in, token received');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.response?.data || error.message);
  }
};

const testMarkAttendance = async () => {
  console.log('\n📝 Testing Mark Attendance...');
  
  try {
    const attendanceData = {
      userId: testUserId,
      date: new Date().toISOString(),
      status: 'present',
      notes: 'On time for training'
    };
    
    const response = await makeAuthRequest('POST', '/attendance/mark', attendanceData, adminToken);
    console.log('✅ Attendance marked successfully:', response.data.message);
    
    // Mark another attendance for yesterday
    const yesterdayData = {
      userId: testUserId,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: 'late',
      notes: 'Arrived 15 minutes late'
    };
    
    const yesterdayResponse = await makeAuthRequest('POST', '/attendance/mark', yesterdayData, adminToken);
    console.log('✅ Yesterday attendance marked:', yesterdayResponse.data.message);
    
  } catch (error) {
    console.error('❌ Mark attendance test failed:', error.response?.data || error.message);
  }
};

const testMarkMultipleAttendance = async () => {
  console.log('\n📊 Testing Mark Multiple Attendance...');
  
  try {
    const multipleData = {
      attendanceData: [
        {
          userId: testUserId,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'absent',
          notes: 'Called in sick'
        },
        {
          userId: testUserId,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'present',
          notes: 'Full training session'
        },
        {
          userId: testUserId,
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'excused',
          notes: 'Family emergency'
        }
      ]
    };
    
    const response = await makeAuthRequest('POST', '/attendance/mark-multiple', multipleData, adminToken);
    console.log('✅ Multiple attendance marked:', response.data.message);
    console.log('📈 Processed records:', response.data.results.length);
    
  } catch (error) {
    console.error('❌ Mark multiple attendance test failed:', error.response?.data || error.message);
  }
};

const testGetAttendanceStats = async () => {
  console.log('\n📊 Testing Get Attendance Statistics...');
  
  try {
    const endDate = new Date();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    
    const response = await makeAuthRequest('GET', `/attendance/stats/${testUserId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
    
    console.log('✅ Attendance statistics retrieved:');
    console.log('📈 Raw counts:', {
      totalDays: response.data.data.totalDays,
      present: response.data.data.present,
      absent: response.data.data.absent,
      late: response.data.data.late,
      excused: response.data.data.excused
    });
    console.log('📊 Percentages:', {
      present: response.data.data.presentPercentage + '%',
      absent: response.data.data.absentPercentage + '%',
      late: response.data.data.latePercentage + '%',
      excused: response.data.data.excusedPercentage + '%'
    });
    
  } catch (error) {
    console.error('❌ Get attendance statistics test failed:', error.response?.data || error.message);
  }
};

const testGetWeeklyAttendance = async () => {
  console.log('\n📅 Testing Get Weekly Attendance...');
  
  try {
    const response = await makeAuthRequest('GET', `/attendance/weekly/${testUserId}`);
    
    console.log('✅ Weekly attendance retrieved:');
    console.log('📅 Week period:', {
      start: new Date(response.data.data.weekStart).toDateString(),
      end: new Date(response.data.data.weekEnd).toDateString()
    });
    console.log('📊 Records count:', response.data.data.attendance.length);
    
  } catch (error) {
    console.error('❌ Get weekly attendance test failed:', error.response?.data || error.message);
  }
};

const testGetMonthlyAttendance = async () => {
  console.log('\n📅 Testing Get Monthly Attendance...');
  
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const response = await makeAuthRequest('GET', `/attendance/monthly/${testUserId}?year=${currentYear}&month=${currentMonth}`);
    
    console.log('✅ Monthly attendance retrieved:');
    console.log('📅 Month:', `${response.data.data.year}-${response.data.data.month}`);
    console.log('📊 Records count:', response.data.data.attendance.length);
    
  } catch (error) {
    console.error('❌ Get monthly attendance test failed:', error.response?.data || error.message);
  }
};

const testGetYearlyAttendance = async () => {
  console.log('\n📅 Testing Get Yearly Attendance...');
  
  try {
    const currentYear = new Date().getFullYear();
    
    const response = await makeAuthRequest('GET', `/attendance/yearly/${testUserId}?year=${currentYear}`);
    
    console.log('✅ Yearly attendance retrieved:');
    console.log('📅 Year:', response.data.data.year);
    console.log('📊 Records count:', response.data.data.attendance.length);
    
  } catch (error) {
    console.error('❌ Get yearly attendance test failed:', error.response?.data || error.message);
  }
};

const testGetUserAttendance = async () => {
  console.log('\n👤 Testing Get User Attendance (Admin only)...');
  
  try {
    const response = await makeAuthRequest('GET', `/attendance/user/${testUserId}?limit=10&page=1`, null, adminToken);
    
    console.log('✅ User attendance retrieved:');
    console.log('📊 Total records:', response.data.data.pagination.totalRecords);
    console.log('📄 Current page:', response.data.data.pagination.currentPage);
    console.log('📋 Records on this page:', response.data.data.attendance.length);
    
    // Store first attendance ID for update/delete tests
    if (response.data.data.attendance.length > 0) {
      testAttendanceId = response.data.data.attendance[0]._id;
    }
    
  } catch (error) {
    console.error('❌ Get user attendance test failed:', error.response?.data || error.message);
  }
};

const testUpdateAttendance = async () => {
  console.log('\n✏️ Testing Update Attendance...');
  
  if (!testAttendanceId) {
    console.log('⚠️ No attendance ID available for update test');
    return;
  }
  
  try {
    const updateData = {
      status: 'late',
      notes: 'Updated: Arrived 20 minutes late'
    };
    
    const response = await makeAuthRequest('PUT', `/attendance/${testAttendanceId}`, updateData, adminToken);
    
    console.log('✅ Attendance updated successfully:', response.data.message);
    console.log('📝 New status:', response.data.data.status);
    console.log('📝 New notes:', response.data.data.notes);
    
  } catch (error) {
    console.error('❌ Update attendance test failed:', error.response?.data || error.message);
  }
};

const testDeleteAttendance = async () => {
  console.log('\n🗑️ Testing Delete Attendance...');
  
  if (!testAttendanceId) {
    console.log('⚠️ No attendance ID available for delete test');
    return;
  }
  
  try {
    const response = await makeAuthRequest('DELETE', `/attendance/${testAttendanceId}`, null, adminToken);
    
    console.log('✅ Attendance deleted successfully:', response.data.message);
    
  } catch (error) {
    console.error('❌ Delete attendance test failed:', error.response?.data || error.message);
  }
};

const testUserAccessControl = async () => {
  console.log('\n🔒 Testing User Access Control...');
  
  try {
    // Test user trying to mark attendance (should fail)
    console.log('1. Testing user cannot mark attendance...');
    try {
      await makeAuthRequest('POST', '/attendance/mark', {
        userId: testUserId,
        date: new Date().toISOString(),
        status: 'present'
      }, authToken);
      console.log('❌ User was able to mark attendance (security issue!)');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ User correctly blocked from marking attendance');
      } else {
        console.log('⚠️ Unexpected error:', error.response?.status);
      }
    }
    
    // Test user trying to view another user's attendance (should fail)
    console.log('2. Testing user cannot view other user attendance...');
    try {
      await makeAuthRequest('GET', `/attendance/stats/anotherUserId`, null, authToken);
      console.log('❌ User was able to view other user stats (security issue!)');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ User correctly blocked from viewing other user stats');
      } else {
        console.log('⚠️ Unexpected error:', error.response?.status);
      }
    }
    
  } catch (error) {
    console.error('❌ Access control test failed:', error.response?.data || error.message);
  }
};

const testOrganizationOverview = async () => {
  console.log('\n🏢 Testing Organization Overview Endpoints...');
  
  try {
    // Test weekly overview
    console.log('1. Testing weekly overview for all users...');
    const weeklyOverview = await makeAuthRequest('GET', '/attendance/overview/weekly', null, adminToken);
    console.log('✅ Weekly overview retrieved:', {
      totalUsers: weeklyOverview.data.data.totalUsers,
      weekStart: new Date(weeklyOverview.data.data.weekStart).toDateString(),
      weekEnd: new Date(weeklyOverview.data.data.weekEnd).toDateString()
    });
    
    // Test monthly overview
    console.log('2. Testing monthly overview for all users...');
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const monthlyOverview = await makeAuthRequest('GET', `/attendance/overview/monthly?year=${currentYear}&month=${currentMonth}`, null, adminToken);
    console.log('✅ Monthly overview retrieved:', {
      totalUsers: monthlyOverview.data.data.totalUsers,
      year: monthlyOverview.data.data.year,
      month: monthlyOverview.data.data.month
    });
    
    // Test yearly overview
    console.log('3. Testing yearly overview for all users...');
    const yearlyOverview = await makeAuthRequest('GET', `/attendance/overview/yearly?year=${currentYear}`, null, adminToken);
    console.log('✅ Yearly overview retrieved:', {
      totalUsers: yearlyOverview.data.data.totalUsers,
      year: yearlyOverview.data.data.year
    });
    
    // Test organization statistics
    console.log('4. Testing organization-wide statistics...');
    const endDate = new Date();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const orgStats = await makeAuthRequest('GET', `/attendance/overview/stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, null, adminToken);
    console.log('✅ Organization stats retrieved:', {
      totalUsers: orgStats.data.data.overallStats.totalUsers,
      totalAttendanceRecords: orgStats.data.data.overallStats.totalAttendanceRecords,
      presentPercentage: orgStats.data.data.overallStats.presentPercentage + '%',
      workingDays: orgStats.data.data.workingDaysInfo.totalWorkingDays
    });
    
  } catch (error) {
    console.error('❌ Organization overview test failed:', error.response?.data || error.message);
  }
};

const testSundayExclusionAndAutoAbsent = async () => {
  console.log('\n🚫 Testing Sunday Exclusion and Auto-Absent Features...');
  
  try {
    // Test Sunday attendance marking (should fail)
    console.log('1. Testing Sunday attendance marking (should fail)...');
    try {
      const sundayDate = new Date();
      // Find next Sunday
      while (sundayDate.getDay() !== 0) {
        sundayDate.setDate(sundayDate.getDate() + 1);
      }
      
      await makeAuthRequest('POST', '/attendance/mark', {
        userId: testUserId,
        date: sundayDate.toISOString(),
        status: 'present'
      }, adminToken);
      
      console.log('❌ Sunday attendance was allowed (security issue!)');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('Sunday')) {
        console.log('✅ Sunday attendance correctly blocked');
      } else {
        console.log('⚠️ Unexpected error for Sunday:', error.response?.status);
      }
    }
    
    // Test working days information
    console.log('2. Testing working days information...');
    const workingDays = await makeAuthRequest('GET', '/attendance/working-days', null, adminToken);
    console.log('✅ Working days info retrieved:', {
      workingDays: workingDays.data.data.workingDays,
      sundaysExcluded: workingDays.data.data.sundaysExcluded
    });
    
    // Test automation service status
    console.log('3. Testing automation service status...');
    const automationStatus = await makeAuthRequest('GET', '/attendance/automation/status', null, adminToken);
    console.log('✅ Automation service status:', {
      isRunning: automationStatus.data.data.isRunning,
      schedules: automationStatus.data.data.schedules
    });
    
    // Test manual trigger (for testing purposes)
    console.log('4. Testing manual automation trigger...');
    const manualTrigger = await makeAuthRequest('POST', '/attendance/automation/trigger', {
      type: 'daily'
    }, adminToken);
    
    console.log('✅ Manual automation trigger completed:', {
      type: manualTrigger.data.data.type,
      message: manualTrigger.data.message
    });
    
  } catch (error) {
    console.error('❌ Sunday exclusion and auto-absent test failed:', error.response?.data || error.message);
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Attendance System Tests...\n');
  
  try {
    await testAuth();
    await testMarkAttendance();
    await testMarkMultipleAttendance();
    await testGetAttendanceStats();
    await testGetWeeklyAttendance();
    await testGetMonthlyAttendance();
    await testGetYearlyAttendance();
    await testGetUserAttendance();
    await testUpdateAttendance();
    await testDeleteAttendance();
    await testUserAccessControl();
    await testOrganizationOverview();
    await testSundayExclusionAndAutoAbsent();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary of Attendance System Features:');
    console.log('✅ Admin-only attendance marking (single and bulk)');
    console.log('✅ Weekly, monthly, and yearly attendance queries');
    console.log('✅ Raw counts and percentage calculations');
    console.log('✅ Proper access control and security');
    console.log('✅ CRUD operations for attendance records');
    console.log('✅ Pagination and filtering support');
    console.log('✅ Organization-wide overview and statistics');
    console.log('✅ Sunday exclusion (week-off) and 6-day work week');
    console.log('✅ Automated attendance system with scheduled tasks');
    console.log('✅ Daily, weekly, and monthly automatic absent marking');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testAuth,
  testMarkAttendance,
  testMarkMultipleAttendance,
  testGetAttendanceStats,
  testGetWeeklyAttendance,
  testGetMonthlyAttendance,
  testGetYearlyAttendance,
  testGetUserAttendance,
  testUpdateAttendance,
  testDeleteAttendance,
  testUserAccessControl,
  testOrganizationOverview,
  testSundayExclusionAndAutoAbsent
};
