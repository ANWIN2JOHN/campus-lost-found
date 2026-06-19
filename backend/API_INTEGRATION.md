/**
 * API Integration Guide for Frontend
 * 
 * This guide explains how to integrate the backend API with the frontend application.
 */

# API Integration Guide

## Base URL

```
Development:  http://localhost:5000/api
Production:   https://api.campus-lost-found.com/api
```

## Authentication

All protected endpoints require the `Authorization` header with a Bearer token:

```
Authorization: Bearer <accessToken>
```

### Login Flow

**Request:**
```typescript
POST /auth/login
Content-Type: application/json

{
  "email": "admin@campus.edu",
  "password": "admin@12345"
}
```

**Response:**
```typescript
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "admin@campus.edu",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Token Refresh

**Request:**
```typescript
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```typescript
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## Lost Items API

### Report Lost Item

**Request:**
```typescript
POST /items/lost/report
Content-Type: application/json

{
  "name": "Blue Backpack",
  "description": "Navy blue backpack with laptop inside",
  "category": "Bags & Backpacks",
  "location": "Library - 3rd Floor",
  "dateLost": "2024-01-15T10:00:00Z",
  "contactType": "student",
  "studentName": "John Doe",
  "rollNo": "2024001",
  "studentPhone": "+91-9876543210",
  "studentEmail": "john@campus.edu",
  "imageUrl": "https://example.com/image.jpg" // optional
}
```

**Response:**
```typescript
{
  "success": true,
  "message": "Lost item reported successfully",
  "data": {
    "_id": "item_id",
    "name": "Blue Backpack",
    "description": "Navy blue backpack with laptop inside",
    "category": "Bags & Backpacks",
    "location": "Library - 3rd Floor",
    "dateLost": "2024-01-15T10:00:00Z",
    "contact": {
      "type": "student",
      "studentName": "John Doe",
      "rollNo": "2024001",
      "studentPhone": "+91-9876543210",
      "studentEmail": "john@campus.edu"
    },
    "status": "Not Returned",
    "reportedAt": "2024-01-20T12:00:00Z",
    "lastUpdated": "2024-01-20T12:00:00Z"
  }
}
```

### Browse Lost Items

**Request:**
```typescript
GET /items/lost?page=1&limit=6&category=Bags%20%26%20Backpacks&status=Not%20Returned&search=backpack
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 6) - Items per page
- `search` (string) - Search in name, description, location
- `category` (string) - Filter by category
- `location` (string) - Filter by location
- `status` (string) - "Not Returned" or "Returned"
- `dateFrom` (ISO string) - Filter by date range (from)
- `dateTo` (ISO string) - Filter by date range (to)

**Response:**
```typescript
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "item_id",
        "name": "Blue Backpack",
        "description": "Navy blue backpack with laptop inside",
        "category": "Bags & Backpacks",
        "location": "Library - 3rd Floor",
        "dateLost": "2024-01-15T10:00:00Z",
        "contact": { /* contact info */ },
        "status": "Not Returned",
        "reportedAt": "2024-01-20T12:00:00Z",
        "lastUpdated": "2024-01-20T12:00:00Z",
        "countdownInfo": {
          "daysRemaining": 45,
          "daysElapsed": 15,
          "isExpired": false,
          "countdownStatus": "active"
        }
      }
    ],
    "total": 24,
    "page": 1,
    "limit": 6,
    "totalPages": 4,
    "hasMore": true
  }
}
```

### Get Single Lost Item

**Request:**
```typescript
GET /items/lost/:id
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "_id": "item_id",
    "name": "Blue Backpack",
    // ... full item object with countdownInfo
  }
}
```

### Update Lost Item Status (Protected)

**Request:**
```typescript
PUT /items/lost/:id
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "status": "Returned",
  "returnedBy": "Jane Smith",
  "returnedRollNo": "2024002"
}
```

**Response:**
```typescript
{
  "success": true,
  "message": "Item status updated successfully",
  "data": { /* updated item */ }
}
```

### Delete Lost Item (Protected)

**Request:**
```typescript
DELETE /items/lost/:id
Authorization: Bearer <accessToken>
```

**Response:**
```typescript
{
  "success": true,
  "message": "Lost item deleted successfully"
}
```

## Found Items API

### Report Found Item

**Request:**
```typescript
POST /items/found/report
Content-Type: application/json

{
  "name": "Silver Keychain",
  "description": "Silver keychain with name tag",
  "category": "Keys & Keychains",
  "location": "Cafeteria",
  "dateFound": "2024-01-20T14:00:00Z",
  "collectFrom": "Admin Reception",
  "contactType": "staff",
  "staffName": "Mr. ABC",
  "employeeId": "EMP001",
  "department": "Security",
  "staffPhone": "+91-9876543210",
  "staffEmail": "security@campus.edu"
}
```

### Browse Found Items

**Request:**
```typescript
GET /items/found?page=1&limit=6&category=Keys%20%26%20Keychains
```

Same query parameters as lost items.

### Update Found Item Status (Protected)

**Request:**
```typescript
PUT /items/found/:id
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "status": "Returned",
  "claimedBy": "John Doe",
  "claimedRollNo": "2024001",
  "claimedPhone": "+91-9876543210",
  "claimedEmail": "john@campus.edu"
}
```

## History API (Protected)

All history endpoints require authentication.

### Get Claimed Items

**Request:**
```typescript
GET /history/claimed?page=1&limit=10&search=John
Authorization: Bearer <accessToken>
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "record_id",
        "itemName": "Blue Backpack",
        "itemType": "Lost",
        "student": "John Doe",
        "rollNo": "2024001",
        "returnedDate": "2024-01-20T15:30:00Z",
        "status": "Returned"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "hasMore": true
  }
}
```

### Get Lost & Not Found Items

**Request:**
```typescript
GET /history/lost-not-found?page=1&limit=10
Authorization: Bearer <accessToken>
```

Returns items that were reported as lost but not claimed within 60 days.

### Get Disposed Items

**Request:**
```typescript
GET /history/disposed?page=1&limit=10
Authorization: Bearer <accessToken>
```

### Mark Item as Disposed (Protected)

**Request:**
```typescript
POST /history/disposed/:itemId/:itemType
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "disposalLocation": "Storage Room B",
  "donatedTo": "NSS",
  "notes": "Item condition was deteriorated"
}
```

**Response:**
```typescript
{
  "success": true,
  "message": "Item marked as disposed successfully"
}
```

## Admin Only Endpoints

These endpoints return all items with detailed information for admin dashboard.

### Get All Lost Items (Admin)

**Request:**
```typescript
GET /items/lost/admin/list?page=1&limit=25&status=Not%20Returned&search=john
Authorization: Bearer <accessToken>
```

### Get All Found Items (Admin)

**Request:**
```typescript
GET /items/found/admin/list?page=1&limit=25&status=Not%20Returned
Authorization: Bearer <accessToken>
```

### Get Expired Items

**Request:**
```typescript
GET /items/lost/expired
Authorization: Bearer <accessToken>
```

Returns lost items that have exceeded 60-day claim period.

## Error Responses

### Validation Error
```typescript
{
  "success": false,
  "message": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "\"email\" is required"
    },
    {
      "field": "dateLost",
      "message": "\"dateLost\" must be a valid date"
    }
  ]
}
```

### Authentication Error
```typescript
// If email is not found
{
  "success": false,
  "message": "Invalid email or password"
}

// If password is incorrect
{
  "success": false,
  "message": "Invalid password"
}
```

### Authorization Error
```typescript
{
  "success": false,
  "message": "Admin access required"
}
```

### Not Found Error
```typescript
{
  "success": false,
  "message": "Lost item not found"
}
```

## Frontend Implementation Example

### Login & Token Management

```typescript
// Login
const loginUser = async (email: string, password: string) => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return data.data.user;
  }
};

// API Request with Token
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
};

// Report Lost Item
const reportLostItem = async (itemData) => {
  return apiRequest('http://localhost:5000/api/items/lost/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData)
  });
};
```

## Countdown Status

The `countdownStatus` field indicates the item's claim period status:

- `"active"` - More than 30 days remaining (green)
- `"expiring"` - 11-30 days remaining (yellow)
- `"last10"` - 1-10 days remaining (red)
- `"expired"` - 0 days remaining (gray, item can be disposed)

## Rate Limiting

API endpoints are rate-limited to 100 requests per 15 minutes per IP address.

Response header indicates remaining requests:
```
RateLimit-Remaining: 99
RateLimit-Reset: 1642598400
```

---

For detailed information, refer to the backend README.md file.
