# Attendance System Documentation

## Overview

The Attendance System is a comprehensive solution for tracking user attendance in the Sport Management application. It provides admin-only attendance management with detailed reporting capabilities including weekly, monthly, and yearly views, along with both raw counts and percentage calculations.

**🔄 Business Rules:**
- **6-day work week**: Monday to Saturday (excluding Sundays)
- **Sunday is always a week-off**: No attendance required or allowed
- **Automatic absent marking**: Unmarked working days are automatically marked as absent by the server
- **Statistics exclude Sundays**: All calculations are based on working days only
- **Fully automated**: No manual intervention required for absent marking

## Features

### 🔐 Security & Access Control
- **Admin-only attendance management**: Only users with `admin` role can mark, update, or delete attendance
- **User privacy**: Users can only view their own attendance data
- **Role-based access control**: Proper middleware validation for all operations

### 📊 Attendance Tracking
- **Multiple status types**: `present`, `absent`, `late`, `excused`
- **Flexible date handling**: Support for any date, including past dates
- **Notes system**: Optional notes for each attendance record
- **Audit trail**: Tracks which admin marked each attendance record

### 📈 Reporting & Analytics
- **Weekly attendance**: Get attendance for any week period
- **Monthly attendance**: Monthly breakdown with year/month parameters
- **Yearly attendance**: Complete year overview
- **Custom date ranges**: Flexible start/end date queries
- **Statistics**: Raw counts and percentage calculations
- **Pagination**: Support for large datasets

### 🚀 Performance Features
- **Bulk operations**: Mark multiple users' attendance simultaneously
- **Database indexing**: Optimized queries with compound indexes
- **Efficient aggregation**: MongoDB aggregation pipeline for statistics

### 🤖 Automation System
- **Scheduled tasks**: Automatic attendance checking and absent marking
- **Daily automation**: Runs at 11:59 PM to mark absent for unmarked working days
- **Weekly automation**: Runs every Sunday at 12:01 AM to process previous week
- **Monthly automation**: Runs on 1st of each month at 12:01 AM to process previous month
- **Sunday exclusion**: Automatically skips Sundays (week-off days)
- **System-generated records**: Auto-marked absent records are clearly identified

## API Endpoints

### Authentication Required
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### 1. Mark Attendance (Admin Only)
**POST** `/api/attendance/mark`

Mark or update attendance for a single user.

**Request Body:**
```json
{
  "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "date": "2024-01-15T00:00:00.000Z",
  "status": "present",
  "notes": "On time for training"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "user": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "date": "2024-01-15T00:00:00.000Z",
    "status": "present",
    "notes": "On time for training",
    "markedBy": "64f1a2b3c4d5e6f7g8h9i0j3",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Mark Multiple Attendance (Admin Only)
**POST** `/api/attendance/mark-multiple`

Mark attendance for multiple users simultaneously.

**Request Body:**
```json
{
  "attendanceData": [
    {
      "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
      "date": "2024-01-15T00:00:00.000Z",
      "status": "present",
      "notes": "On time"
    },
    {
      "userId": "64f1a2b3c4d5e6f7g8h9i0j4",
      "date": "2024-01-15T00:00:00.000Z",
      "status": "late",
      "notes": "Arrived 15 minutes late"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk attendance processing completed",
  "results": [
    {
      "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
      "success": true,
      "message": "Attendance processed successfully",
      "data": { /* attendance object */ }
    },
    {
      "userId": "64f1a2b3c4d5e6f7g8h9i0j4",
      "success": true,
      "message": "Attendance processed successfully",
      "data": { /* attendance object */ }
    }
  ]
}
```

### 3. Get Attendance Statistics
**GET** `/api/attendance/stats/:userId?startDate=<date>&endDate=<date>`

Get attendance statistics for a specific date range. Users can only view their own stats unless they're admin.

**Query Parameters:**
- `startDate`: Start date in ISO format (required)
- `endDate`: End date in ISO format (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDays": 30,
    "present": 25,
    "absent": 3,
    "late": 1,
    "excused": 1,
    "presentPercentage": 83.33,
    "absentPercentage": 10.00,
    "latePercentage": 3.33,
    "excusedPercentage": 3.33
  }
}
```

### 4. Get Weekly Attendance
**GET** `/api/attendance/weekly/:userId?weekStart=<date>`

Get attendance for a specific week. If no `weekStart` is provided, uses current week.

**Response:**
```json
{
  "success": true,
  "data": {
    "weekStart": "2024-01-15T00:00:00.000Z",
    "weekEnd": "2024-01-21T23:59:59.999Z",
    "attendance": [
      {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "date": "2024-01-15T00:00:00.000Z",
        "status": "present",
        "notes": "On time"
      }
      // ... more attendance records
    ]
  }
}
```

### 5. Get Monthly Attendance
**GET** `/api/attendance/monthly/:userId?year=<year>&month=<month>`

Get attendance for a specific month. If no parameters provided, uses current month.

**Query Parameters:**
- `year`: Year (e.g., 2024)
- `month`: Month (1-12)

**Response:**
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "month": 1,
    "attendance": [
      // ... attendance records for January 2024
    ]
  }
}
```

### 6. Get Yearly Attendance
**GET** `/api/attendance/yearly/:userId?year=<year>`

Get attendance for a specific year. If no year provided, uses current year.

**Response:**
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "attendance": [
      // ... all attendance records for 2024
    ]
  }
}
```

### 7. Get User Attendance (Admin Only)
**GET** `/api/attendance/user/:userId?page=<page>&limit=<limit>&startDate=<date>&endDate=<date>`

Get all attendance records for a specific user with pagination and optional date filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Records per page (default: 50)
- `startDate`: Filter start date (optional)
- `endDate`: Filter end date (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "attendance": [
      // ... attendance records
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalRecords": 150,
      "limit": 50
    }
  }
}
```

### 8. Update Attendance (Admin Only)
**PUT** `/api/attendance/:attendanceId`

Update an existing attendance record.

**Request Body:**
```json
{
  "status": "late",
  "notes": "Updated: Arrived 20 minutes late"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance updated successfully",
  "data": {
    // ... updated attendance object
  }
}
```

### 9. Delete Attendance (Admin Only)
**DELETE** `/api/attendance/:attendanceId`

Delete an attendance record.

**Response:**
```json
{
  "success": true,
  "message": "Attendance record deleted successfully"
}
```

## Organization-Wide Endpoints (Admin Only)

### 10. Get All Users' Weekly Attendance
**GET** `/api/attendance/overview/weekly?weekStart=<date>`

Get attendance overview for all users in a specific week.

**Query Parameters:**
- `weekStart`: Start of week date (optional, defaults to current week)

**Response:**
```json
{
  "success": true,
  "data": {
    "weekStart": "2024-01-15T00:00:00.000Z",
    "weekEnd": "2024-01-21T23:59:59.999Z",
    "totalUsers": 25,
    "userAttendance": [
      {
        "user": {
          "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "role": "user"
        },
        "attendance": [
          {
            "date": "2024-01-15T00:00:00.000Z",
            "status": "present",
            "notes": "On time"
          }
        ],
        "summary": {
          "present": 5,
          "absent": 0,
          "late": 1,
          "excused": 0,
          "totalDays": 6,
          "presentPercentage": 83.33,
          "absentPercentage": 0,
          "latePercentage": 16.67,
          "excusedPercentage": 0
        }
      }
    ]
  }
}
```

### 11. Get All Users' Monthly Attendance
**GET** `/api/attendance/overview/monthly?year=<year>&month=<month>`

Get attendance overview for all users in a specific month.

**Query Parameters:**
- `year`: Year (e.g., 2024)
- `month`: Month (1-12)

**Response:**
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "month": 1,
    "totalUsers": 25,
    "userAttendance": [
      // ... user attendance data for each user
    ]
  }
}
```

### 12. Get All Users' Yearly Attendance
**GET** `/api/attendance/overview/yearly?year=<year>`

Get attendance overview for all users in a specific year.

**Query Parameters:**
- `year`: Year (e.g., 2024)

**Response:**
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "totalUsers": 25,
    "userAttendance": [
      // ... user attendance data for each user
    ]
  }
}
```

### 13. Get Organization-Wide Statistics
**GET** `/api/attendance/overview/stats?startDate=<date>&endDate=<date>`

Get comprehensive attendance statistics for the entire organization.

**Query Parameters:**
- `startDate`: Start date in ISO format (required)
- `endDate`: End date in ISO format (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "overallStats": {
      "totalUsers": 25,
      "totalAttendanceRecords": 750,
      "present": 600,
      "absent": 100,
      "late": 30,
      "excused": 20,
      "totalDays": 750,
      "presentPercentage": 80.00,
      "absentPercentage": 13.33,
      "latePercentage": 4.00,
      "excusedPercentage": 2.67
    },
    "userStats": [
      {
        "user": {
          "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "role": "user"
        },
        "present": 24,
        "absent": 3,
        "late": 2,
        "excused": 1,
        "totalDays": 30,
        "presentPercentage": 80.00,
        "absentPercentage": 10.00,
        "latePercentage": 6.67,
        "excusedPercentage": 3.33
      }
    ]
  }
}
```

### 14. Get Automation Service Status (Admin Only)
**GET** `/api/attendance/automation/status`

Get the current status of the automated attendance system.

**Response:**
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "schedules": {
      "daily": "59 23 * * * (11:59 PM daily)",
      "weekly": "1 0 * * 0 (12:01 AM every Sunday)",
      "monthly": "1 0 1 * * (12:01 AM 1st of every month)"
    }
  }
}
```

### 15. Manual Trigger Automation (Admin Only)
**POST** `/api/attendance/automation/trigger`

Manually trigger the automation system for testing or immediate execution.

**Request Body:**
```json
{
  "type": "daily" // "daily", "weekly", or "monthly"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Manual daily attendance check triggered successfully",
  "data": {
    "type": "daily",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "note": "Check server logs for detailed results"
  }
}
```

**Note:** This endpoint is primarily for testing purposes. The system runs automatically according to the scheduled tasks.

### 16. Get Working Days Information
**GET** `/api/attendance/working-days`

Get information about working days (excluding Sundays) for various time periods.

**Query Parameters:**
- `startDate` & `endDate`: Date range for working days count
- `year` & `month`: Specific month working days
- `year`: Specific year working days
- No parameters: Current week working days

**Response Examples:**

**Date Range:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "workingDays": 26,
    "sundaysExcluded": true,
    "note": "Working days exclude Sundays (week-off)"
  }
}
```

**Current Week:**
```json
{
  "success": true,
  "data": {
    "currentWeek": true,
    "workingDays": 6,
    "workingDates": ["2024-01-15", "2024-01-16", "2024-01-17", "2024-01-18", "2024-01-19", "2024-01-20"],
    "sundaysExcluded": true,
    "note": "Working days exclude Sundays (week-off)"
  }
}
```

## Data Models

### Attendance Schema
```javascript
{
  user: ObjectId,           // Reference to User model
  date: Date,               // Attendance date
  status: String,           // 'present', 'absent', 'late', 'excused'
  notes: String,            // Optional notes (max 500 chars)
  markedBy: ObjectId,       // Reference to admin who marked attendance
  createdAt: Date,          // Auto-generated timestamp
  updatedAt: Date           // Auto-generated timestamp
}
```

### Status Types
- **present**: User attended on time
- **absent**: User did not attend
- **late**: User attended but was late
- **excused**: User was excused from attendance

## Usage Examples

### Frontend Integration

#### Mark Attendance (Admin)
```javascript
const markAttendance = async (userId, date, status, notes) => {
  try {
    const response = await fetch('/api/attendance/mark', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        userId,
        date,
        status,
        notes
      })
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('Attendance marked successfully');
    }
  } catch (error) {
    console.error('Error marking attendance:', error);
  }
};
```

#### Get Weekly Statistics
```javascript
const getWeeklyStats = async (userId) => {
  try {
    const response = await fetch(`/api/attendance/stats/${userId}?startDate=${weekStart}&endDate=${weekEnd}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.success) {
      const stats = data.data;
      console.log(`Present: ${stats.present}/${stats.totalDays} (${stats.presentPercentage}%)`);
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};
```

### Bulk Operations
```javascript
const markBulkAttendance = async (attendanceData) => {
  try {
    const response = await fetch('/api/attendance/mark-multiple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ attendanceData })
    });
    
    const data = await response.json();
    if (data.success) {
      data.results.forEach(result => {
        if (result.success) {
          console.log(`User ${result.userId}: ${result.message}`);
        } else {
          console.error(`User ${result.userId}: ${result.message}`);
        }
      });
    }
  } catch (error) {
    console.error('Error in bulk operation:', error);
  }
};
```

### Organization-Wide Overview
```javascript
// Get weekly overview for all users
const getWeeklyOverview = async () => {
  try {
    const response = await fetch('/api/attendance/overview/weekly', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const data = await response.json();
    if (data.success) {
      console.log(`Weekly Overview: ${data.data.totalUsers} users`);
      data.data.userAttendance.forEach(user => {
        const summary = user.summary;
        console.log(`${user.user.firstName} ${user.user.lastName}: ${summary.presentPercentage}% present`);
      });
    }
  } catch (error) {
    console.error('Error fetching weekly overview:', error);
  }
};

// Get monthly overview for all users
const getMonthlyOverview = async (year, month) => {
  try {
    const response = await fetch(`/api/attendance/overview/monthly?year=${year}&month=${month}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const data = await response.json();
    if (data.success) {
      console.log(`Monthly Overview (${data.data.year}-${data.data.month}): ${data.data.totalUsers} users`);
    }
  } catch (error) {
    console.error('Error fetching monthly overview:', error);
  }
};

// Get organization-wide statistics
const getOrganizationStats = async (startDate, endDate) => {
  try {
    const response = await fetch(`/api/attendance/overview/stats?startDate=${startDate}&endDate=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const data = await response.json();
    if (data.success) {
      const stats = data.data.overallStats;
      console.log(`Organization Stats: ${stats.presentPercentage}% present rate across ${stats.totalUsers} users`);
    }
  } catch (error) {
    console.error('Error fetching organization stats:', error);
  }
};
```

## Business Rules & Sunday Exclusion

### Sunday Week-Off Policy
- **Sunday is always a week-off day**: No attendance required or allowed
- **6-day work week**: Monday to Saturday only
- **Automatic validation**: System prevents marking attendance on Sundays
- **Statistics exclusion**: All calculations exclude Sundays automatically

### Automatic Absent Marking
- **Missing working days**: Unmarked working days are automatically marked as absent
- **Complete coverage**: Ensures no working day is missed in attendance records
- **Admin control**: Admins can trigger auto-absent marking for specific date ranges
- **Bulk processing**: Support for marking multiple users simultaneously

### Working Days Calculation
- **Monday to Saturday**: 6 working days per week
- **Sunday exclusion**: Automatically excluded from all calculations
- **Flexible periods**: Support for weekly, monthly, yearly, and custom date ranges
- **Working days info**: Dedicated endpoint to get working days count and dates

## Security Considerations

### Access Control
- All attendance modification endpoints require admin role
- Users can only view their own attendance data
- Proper JWT token validation on all endpoints

### Data Validation
- Input validation using express-validator
- MongoDB injection protection
- Date format validation
- Status enum validation

### Audit Trail
- All attendance records track which admin created/modified them
- Timestamps for creation and updates
- No permanent deletion without proper logging

## Performance Optimizations

### Database Indexing
- Compound index on `{ user: 1, date: 1 }` for efficient queries
- Unique constraint prevents duplicate attendance records

### Aggregation Pipeline
- Efficient MongoDB aggregation for statistics calculation
- Optimized queries for weekly/monthly/yearly views

### Pagination
- Support for large datasets with configurable page sizes
- Efficient skip/limit operations

## Error Handling

### Common Error Responses

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Admin role required."
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "field": "status",
      "message": "Valid status is required"
    }
  ]
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error marking attendance",
  "error": "Database connection failed"
}
```

## Testing

Run the comprehensive test suite:

```bash
# Install axios for testing
npm install axios

# Run tests
node test-attendance.js
```

The test suite covers:
- Authentication and user creation
- All CRUD operations
- Access control validation
- Bulk operations
- Statistics calculation
- Weekly/monthly/yearly queries
- Organization-wide overview and statistics
- Sunday exclusion and working days calculation
- Automation service status and manual triggers

## Automation System

### Overview
The attendance system now includes a fully automated service that runs scheduled tasks to automatically mark absent for users who don't have attendance records on working days.

### Scheduled Tasks

#### Daily Automation (11:59 PM)
- **Purpose**: Check and mark absent for the current working day
- **Process**: 
  - Identifies all active users
  - Checks if attendance is marked for today
  - Automatically marks absent for unmarked users
  - Skips Sundays (week-off days)
- **Output**: Creates attendance records with `isAutoMarked: true`

#### Weekly Automation (Sunday 12:01 AM)
- **Purpose**: Process the previous week's attendance
- **Process**: 
  - Reviews the past 7 days
  - Identifies missing working days for all users
  - Creates absent records for missing days
  - Excludes Sundays from calculations

#### Monthly Automation (1st of month 12:01 AM)
- **Purpose**: Process the previous month's attendance
- **Process**: 
  - Reviews the entire previous month
  - Identifies missing working days for all users
  - Creates absent records for missing days
  - Excludes Sundays from calculations

### Automation Features
- **Timezone Support**: Configurable timezone (default: Asia/Kolkata)
- **Error Handling**: Individual user processing errors don't stop the entire batch
- **Logging**: Comprehensive logging for monitoring and debugging
- **Manual Triggers**: Admin endpoints for testing and immediate execution
- **Status Monitoring**: Real-time service status and schedule information

### System-Generated Records
Auto-marked absent records include:
- `status: 'absent'`
- `notes: 'Automatically marked absent - no attendance recorded for the day'`
- `markedBy: null` (system-generated)
- `isAutoMarked: true`

### Configuration
The automation service starts automatically when the server starts. Schedules can be modified in `services/attendanceAutomation.js`:
```javascript
// Daily at 11:59 PM
cron.schedule('59 23 * * *', async () => {
  // Daily attendance check
}, { timezone: "Asia/Kolkata" });

// Weekly on Sunday at 12:01 AM
cron.schedule('1 0 * * 0', async () => {
  // Weekly attendance check
}, { timezone: "Asia/Kolkata" });

// Monthly on 1st at 12:01 AM
cron.schedule('1 0 1 * *', async () => {
  // Monthly attendance check
}, { timezone: "Asia/Kolkata" });
```

## Future Enhancements

### Potential Features
- **Attendance templates**: Pre-defined attendance patterns
- **Export functionality**: CSV/PDF reports
- **Email notifications**: Automated attendance reminders
- **Mobile app support**: QR code scanning for attendance
- **Integration**: Calendar system integration
- **Analytics dashboard**: Advanced reporting interface

### Scalability Considerations
- **Caching**: Redis for frequently accessed statistics
- **Background jobs**: Queue-based bulk operations
- **Microservices**: Separate attendance service
- **Real-time updates**: WebSocket notifications

## Support

For questions or issues with the attendance system:
1. Check the API documentation above
2. Review error responses for debugging
3. Test with the provided test suite
4. Ensure proper authentication and role permissions
