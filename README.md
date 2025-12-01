# Sport Management Backend API
A robust Node.js, Express, and MongoDB-based REST API for a complete sports management application. It features comprehensive user management, automated attendance tracking, and a full fee management system.

## Key Features
🔐 JWT Authentication: Secure login/logout and password management with JSON Web Tokens.

👥 User Lifecycle Management: Clean separation of user registration and profile management from authentication.

📅 Automated Attendance System: Detailed attendance tracking (present, absent, late, excused) with an automated service to mark absentees on a 6-day work week (Mon-Sat).

💰 Fee Management System: Automatic fee record creation upon user registration with a default due date of one month. Includes endpoints for admins to manage payments.

🛡️ Role-Based Access Control: Granular control with user and admin roles, protected by middleware.

✅ Robust Input Validation: express-validator used across all routes to ensure data integrity.

🏗️ MVC Architecture: Clean separation of concerns with logic in controllers and endpoint definitions in routes.

📊 MongoDB Integration: Mongoose ODM with clear, well-defined schemas for Users, Attendance, and Fees.

## Prerequisites
Node.js (v14 or higher)

MongoDB (v4.4 or higher)

npm or yarn

## Installation
Clone the repository

git clone <repository-url>
cd Sport-Management-BE

## Install dependencies

npm install

Environment Configuration

Create a .env file in the root directory and add the following variables:

PORT=3000
MONGODB_URI=mongodb://localhost:27017/sport-management
JWT_SECRET=your_super_strong_jwt_secret
JWT_EXPIRE=30m

Run the application

# For development with auto-reloading
npm run dev

# For production
npm start

API Endpoints
All endpoints are prefixed with /api.

User Routes (/user)
Method

Endpoint

Description

Access

POST

/register

Register a new user

Public

GET

/me

Get current user's profile

Private

PUT

/me

Update current user's profile

Private

GET

/all

Get a list of all users

Admin

Authentication Routes (/auth)
Method

Endpoint

Description

Access

POST

/login

Login an existing user

Public

POST

/logout

Logout the current user

Private

POST

/change-password

Change the current user's password

Private

Fee Routes (/fees)
Method

Endpoint

Description

Access

GET

/

Get all fee records (with filters)

Admin

POST

/

Manually create a new fee record

Admin

GET

/:id

Get a single fee record by ID

Private

PATCH

/:id

Update a fee record (e.g., payment)

Admin

DELETE

/:id

Delete a fee record

Admin

Attendance Routes (/attendance)
See the detailed ATTENDANCE_README.md for a full list of over 15 endpoints for detailed weekly, monthly, and yearly reporting for individuals and the entire organization.

API Usage Examples
1. Register a New User
POST /api/user/register

curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "athlete@example.com",
    "password": "password123",
    "firstName": "Alex",
    "lastName": "Ray"
  }'

This will automatically create a corresponding fee record for this user with a status of pending and a dueDate one month from today.

2. Login
POST /api/auth/login

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "athlete@example.com",
    "password": "password123"
  }'

3. Update a Fee Payment (Admin)
PATCH /api/fees/:feeId

curl -X PATCH http://localhost:3000/api/fees/60c72b2f9b1d8c001f8e4b1a \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid",
    "transactionId": "txn_123456789"
  }'

Data Models
User Schema
{
  email: String (required, unique),
  password: String (required, hashed),
  firstName: String (required),
  lastName: String (required),
  role: String (enum: ['user', 'admin'], default: 'user'),
  isActive: Boolean (default: true)
}

Fee Schema
{
  user: ObjectId (ref: 'User'),
  amount: Number (required, default: 2600),
  status: String (enum: ['pending', 'paid', 'overdue'], default: 'pending'),
  dueDate: Date (required, default: 1 month from creation),
  paidDate: Date,
  transactionId: String
}

Attendance Schema
{
  user: ObjectId (ref: 'User'),
  date: Date (required),
  status: String (enum: ['present', 'absent', 'late', 'excused']),
  notes: String,
  markedBy: ObjectId (ref: 'User'),
  isAutoMarked: Boolean (default: false)
}

Project Structure
.
├── controllers/
│   ├── attendanceController.js
│   ├── authController.js
│   ├── feeController.js
│   └── userController.js
├── middleware/
│   ├── adminAuth.js
│   └── auth.js
├── models/
│   ├── Attendance.js
│   ├── Fee.js
│   └── User.js
├── routes/
│   ├── attendance.js
│   ├── auth.js
│   ├── fee.js
│   └── user.js
├── services/
│   └── attendanceAutomation.js
├── .env
├── package.json
└── server.js
