# Sport Management Backend API

A Node.js, Express, and MongoDB-based REST API for sport management with comprehensive authentication and user management features.

## Features

- 🔐 **JWT Authentication** - Secure login/logout with JSON Web Tokens
- 👥 **User Management** - Registration, profile management, and role-based access control
- 🔒 **Password Security** - Bcrypt hashing with salt rounds
- ✅ **Input Validation** - Express-validator for request validation
- 🛡️ **Route Protection** - Middleware for securing private endpoints
- 📊 **MongoDB Integration** - Mongoose ODM with proper schemas
- 🌐 **CORS Support** - Cross-origin resource sharing enabled
- 📝 **Comprehensive Logging** - Error handling and request logging

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Sport-Management-BE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Copy `config.env` and update the values:
   ```bash
   cp config.env .env
   ```
   - Update the following variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A strong secret key for JWT signing
     - `PORT`: Server port (default: 3000)

4. **Start MongoDB**
   - Ensure MongoDB is running on your system
   - Default connection: `mongodb://localhost:27017/sport-management`

5. **Run the application**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Login user | Public |
| `POST` | `/api/auth/logout` | Logout user | Private |
| `GET` | `/api/auth/me` | Get current user profile | Private |
| `PUT` | `/api/auth/me` | Update user profile | Private |
| `POST` | `/api/auth/change-password` | Change user password | Private |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health status |

## API Usage Examples

### 1. User Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }'
```

**Response:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "createdAt": "2023-09-01T10:00:00.000Z",
      "updatedAt": "2023-09-01T10:00:00.000Z"
    }
  }
}
```

### 2. User Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 3. Access Protected Route

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Update Profile

```bash
curl -X PUT http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

### 5. Change Password

```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "password123",
    "newPassword": "newpassword456"
  }'
```

## Data Models

### User Schema

```javascript
{
  email: String (required, unique, validated),
  password: String (required, min 6 chars, hashed),
  firstName: String (required, max 50 chars),
  lastName: String (required, max 50 chars),
  role: String (enum: 'user', 'admin', 'coach', default: 'user'),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

## Security Features

- **Password Hashing**: Bcrypt with 12 salt rounds
- **JWT Tokens**: Secure authentication with configurable expiration
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable cross-origin settings
- **Role-based Access**: Granular permission control
- **Account Status**: User account activation/deactivation

## Error Handling

The API provides consistent error responses:

```json
{
  "status": "error",
  "message": "Descriptive error message",
  "errors": [] // Validation errors (if applicable)
}
```

## Development

### Project Structure

```
Sport-Management-BE/
├── models/          # Mongoose schemas
├── routes/          # Express routes
├── middleware/      # Custom middleware
├── config.env       # Environment variables
├── package.json     # Dependencies and scripts
├── server.js        # Main application file
└── README.md        # This file
```

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (to be implemented)

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/sport-management |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRE` | JWT expiration time | 24h |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository. 