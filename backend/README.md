# Campus Lost & Found - Backend

Production-ready Node.js backend for Campus Lost & Found system.

## Features

- ✅ Admin Authentication (JWT with refresh tokens)
- ✅ Lost Item Management (Report, Browse, Update, Delete)
- ✅ Found Item Management (Report, Browse, Update, Delete)
- ✅ Item History & Records (Claimed, Disposed, Lost & Not Found)
- ✅ 60-day Countdown System
- ✅ Search & Filtering
- ✅ Pagination
- ✅ Role-based Access Control
- ✅ Input Validation
- ✅ Error Handling
- ✅ Rate Limiting
- ✅ CORS Support

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Atlas)
- **ODM**: Mongoose
- **Authentication**: JWT
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## Installation

### Prerequisites

- Node.js 18+ or higher
- MongoDB Atlas account
- npm or pnpm

### Setup

1. **Clone and install dependencies**

   ```bash
   cd backend
   npm install
   # or
   pnpm install
   ```

2. **Create environment file**

   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables**

   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campus-lost-found
   JWT_SECRET=your_secure_secret_key
   JWT_REFRESH_SECRET=your_secure_refresh_secret
   ADMIN_EMAIL=admin@campus.edu
   ADMIN_PASSWORD=admin@12345
   FRONTEND_URL=http://localhost:5173
   ```

4. **Build TypeScript**

   ```bash
   npm run build
   ```

5. **Start the server**

   ```bash
   npm start
   ```

   **For development (with hot reload)**:

   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Admin login
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/profile` - Get current user (protected)

### Lost Items

- `POST /api/items/lost/report` - Report a lost item
- `GET /api/items/lost` - Get lost items (browse)
- `GET /api/items/lost/:id` - Get single lost item
- `GET /api/items/lost/expired` - Get expired items (protected)
- `GET /api/items/lost/admin/list` - Get admin items (protected)
- `PUT /api/items/lost/:id` - Update item status (protected)
- `DELETE /api/items/lost/:id` - Delete item (protected)

### Found Items

- `POST /api/items/found/report` - Report a found item
- `GET /api/items/found` - Get found items (browse)
- `GET /api/items/found/:id` - Get single found item
- `GET /api/items/found/expired` - Get expired items (protected)
- `GET /api/items/found/admin/list` - Get admin items (protected)
- `PUT /api/items/found/:id` - Update item status (protected)
- `DELETE /api/items/found/:id` - Delete item (protected)

### History & Records

- `GET /api/history/claimed` - Get claimed items (protected)
- `GET /api/history/lost-not-found` - Get lost & not found items (protected)
- `GET /api/history/disposed` - Get disposed items (protected)
- `POST /api/history/disposed/:itemId/:itemType` - Mark as disposed (protected)

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts   # MongoDB connection
│   │   └── env.ts        # Environment variables
│   ├── controllers/       # API request handlers
│   ├── middleware/        # Express middleware
│   │   ├── auth.ts       # JWT authentication
│   │   ├── validation.ts # Request validation
│   │   └── errorHandler.ts
│   ├── models/           # Mongoose schemas
│   │   ├── User.ts
│   │   ├── LostItem.ts
│   │   ├── FoundItem.ts
│   │   ├── ClaimedItem.ts
│   │   └── DisposedRecord.ts
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   │   ├── errors.ts     # Custom error classes
│   │   ├── logger.ts     # Logging utility
│   │   ├── countdown.ts  # 60-day countdown logic
│   │   └── catchAsync.ts # Async error wrapper
│   ├── interfaces/       # TypeScript interfaces
│   ├── constants/        # Application constants
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── dist/                 # Compiled JavaScript
├── package.json
├── tsconfig.json
└── .env.example
```

## Database Schemas

### User

```typescript
{
  email: string (unique)
  password: string (hashed)
  role: "admin"
  createdAt: Date
  updatedAt: Date
}
```

### LostItem

```typescript
{
  name: string
  description: string
  category: string
  location: string
  dateLost: Date
  contact: {
    type: "student" | "staff"
    studentName?: string
    rollNo?: string
    studentPhone?: string
    studentEmail?: string
    staffName?: string
    employeeId?: string
    department?: string
    staffPhone?: string
    staffEmail?: string
  }
  status: "Not Returned" | "Returned"
  returnedBy?: string
  returnedRollNo?: string
  returnedDate?: Date
  returnedTime?: string
  imageUrl?: string
  reportedAt: Date
  lastUpdated: Date
}
```

### FoundItem

```typescript
{
  name: string
  description: string
  category: string
  location: string
  dateFound: Date
  collectFrom: string
  contact: { /* same as LostItem */ }
  status: "Not Returned" | "Returned"
  claimedBy?: string
  claimedRollNo?: string
  claimedPhone?: string
  claimedEmail?: string
  returnedDate?: Date
  returnedTime?: string
  imageUrl?: string
  foundAt: Date
  lastUpdated: Date
}
```

### ClaimedItem (Historical)

```typescript
{
  itemName: string
  itemType: "Lost" | "Found"
  student: string
  rollNo: string
  returnedDate: Date
  status: "Returned"
}
```

### DisposedRecord (Historical)

```typescript
{
  itemName: string
  itemType: "Lost" | "Found"
  dateReported: Date
  location: string
  reporter: string
  reporterPhone: string
  reporterEmail: string
  disposalLocation: string
  donatedTo: string
  disposedDate: Date
  notes?: string
}
```

## Authentication Flow

1. **Login**
   - Send: `POST /api/auth/login` with email & password
   - Receive: `accessToken` (24h) & `refreshToken` (7d)

2. **Protected Requests**
   - Include: `Authorization: Bearer <accessToken>`

3. **Refresh Token**
   - Send: `POST /api/auth/refresh-token` with refreshToken
   - Receive: New `accessToken`

## Error Handling

All errors return consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "details": []
}
```

HTTP Status Codes:
- `400` - Bad Request / Validation Error
- `401` - Unauthorized / Invalid Token
- `403` - Forbidden / Access Denied
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `500` - Server Error

## Development

### Available Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Compile TypeScript
npm start        # Run compiled server
npm run lint     # Run ESLint
```

### Environment Variables

Check [.env.example](.env.example) for all available configuration options.

## Production Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Create `.env` file with production values**

3. **Install production dependencies only**
   ```bash
   npm install --production
   ```

4. **Start the server**
   ```bash
   npm start
   ```

## Security Considerations

- ✅ Passwords hashed with bcryptjs
- ✅ JWT tokens with expiration
- ✅ CORS enabled for frontend origin only
- ✅ Rate limiting on API endpoints
- ✅ Helmet for HTTP headers security
- ✅ Input validation with Joi
- ✅ MongoDB injection protection (via Mongoose)
- ⚠️ Change JWT secrets in production
- ⚠️ Change default admin credentials in production
- ⚠️ Use HTTPS in production
- ⚠️ Enable MongoDB IP whitelist

## Maintenance

### Database Indexes

All models include appropriate indexes for common queries:
- Status-based queries
- Date-based sorting
- Email lookups
- Category filtering

### Logs

Check server logs for:
- `✓` Success messages
- `✗` Error messages
- `🚀` Server startup
- `📝` API info

## Support & Issues

For issues or questions, refer to the frontend repository or contact the development team.

---

**Built with ❤️ for Campus Lost & Found System**
