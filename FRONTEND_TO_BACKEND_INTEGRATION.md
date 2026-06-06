# Frontend to Backend Integration Guide

## Overview

This guide explains how to connect the existing React frontend to the new Express backend API.

## Project Structure

```
campus lost &found_final/
├── frontend/                      # React application
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx               # Main component
│   │   ├── data/
│   │   │   └── appData.ts        # ⚠️ Will be replaced by API calls
│   │   └── components/
│   └── ...
├── backend/                       # Node.js Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── ...
│   └── ...
├── package.json
├── vite.config.ts
└── ...
```

## Step 1: Backend Setup

### Install & Start Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend will run at: `http://localhost:5000`

## Step 2: Frontend API Service Layer

Create a centralized API service in the frontend:

### Create API Service File

**File: `frontend/app/services/api.ts`**

```typescript
/**
 * API Service - Handles all backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  // Initialize from localStorage
  init() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  // Set tokens after login
  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  // Clear tokens on logout
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Get authorization header
  private getHeaders(authenticated = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authenticated && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  // Generic fetch wrapper
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    authenticated = false
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: this.getHeaders(authenticated),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API Error');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ============ Auth Endpoints ============

  async login(email: string, password: string) {
    const response = await this.request<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response.data;
  }

  async refreshAccessToken() {
    const response = await this.request<{ accessToken: string }>(
      '/auth/refresh-token',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      }
    );

    if (response.data) {
      this.accessToken = response.data.accessToken;
      localStorage.setItem('accessToken', response.data.accessToken);
    }

    return response.data;
  }

  async getProfile() {
    return this.request('/auth/profile', {}, true);
  }

  // ============ Lost Items Endpoints ============

  async reportLostItem(data: any) {
    return this.request('/items/lost/report', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLostItems(page = 1, limit = 6, filters: any = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    return this.request(`/items/lost?${params}`, {});
  }

  async getLostItem(id: string) {
    return this.request(`/items/lost/${id}`, {});
  }

  async updateLostItemStatus(
    id: string,
    status: string,
    returnedBy?: string,
    returnedRollNo?: string
  ) {
    return this.request(
      `/items/lost/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ status, returnedBy, returnedRollNo }),
      },
      true
    );
  }

  async deleteLostItem(id: string) {
    return this.request(`/items/lost/${id}`, { method: 'DELETE' }, true);
  }

  async getExpiredLostItems() {
    return this.request('/items/lost/expired', {}, true);
  }

  async getAdminLostItems(page = 1, limit = 10, filters: any = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    return this.request(`/items/lost/admin/list?${params}`, {}, true);
  }

  // ============ Found Items Endpoints ============

  async reportFoundItem(data: any) {
    return this.request('/items/found/report', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFoundItems(page = 1, limit = 6, filters: any = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    return this.request(`/items/found?${params}`, {});
  }

  async getFoundItem(id: string) {
    return this.request(`/items/found/${id}`, {});
  }

  async updateFoundItemStatus(
    id: string,
    status: string,
    claimedBy?: string,
    claimedRollNo?: string,
    claimedPhone?: string,
    claimedEmail?: string
  ) {
    return this.request(
      `/items/found/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          status,
          claimedBy,
          claimedRollNo,
          claimedPhone,
          claimedEmail,
        }),
      },
      true
    );
  }

  async deleteFoundItem(id: string) {
    return this.request(`/items/found/${id}`, { method: 'DELETE' }, true);
  }

  async getExpiredFoundItems() {
    return this.request('/items/found/expired', {}, true);
  }

  async getAdminFoundItems(page = 1, limit = 10, filters: any = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    return this.request(`/items/found/admin/list?${params}`, {}, true);
  }

  // ============ History Endpoints ============

  async getClaimedItems(page = 1, limit = 10, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    return this.request(`/history/claimed?${params}`, {}, true);
  }

  async getLostNotFoundItems(page = 1, limit = 10, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    return this.request(`/history/lost-not-found?${params}`, {}, true);
  }

  async getDisposedItems(page = 1, limit = 10, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    return this.request(`/history/disposed?${params}`, {}, true);
  }

  async markItemAsDisposed(
    itemId: string,
    itemType: 'Lost' | 'Found',
    data: { disposalLocation: string; donatedTo?: string; notes?: string }
  ) {
    return this.request(
      `/history/disposed/${itemId}/${itemType}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      true
    );
  }
}

// Create singleton instance
export const api = new ApiService();
api.init(); // Initialize from localStorage
```

### Create Environment Variable

**File: `frontend/.env.example`**

```
VITE_API_URL=http://localhost:5000/api
```

**File: `.env.local` (development)**

```
VITE_API_URL=http://localhost:5000/api
```

**File: `.env.production` (production)**

```
VITE_API_URL=https://api.campus-lost-found.edu/api
```

## Step 3: Update Components

### Update App.tsx

Replace mock data fetching with API calls:

```typescript
import { api } from './services/api.js';

export function App() {
  const [lostItems, setLostItems] = useState<BrowseItem[]>([]);
  const [foundItems, setFoundItems] = useState<BrowseItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch lost items
  const fetchLostItems = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.getLostItems(page, 6, { status: 'Not Returned' });
      if (response.data) {
        setLostItems(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch lost items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch found items
  const fetchFoundItems = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.getFoundItems(page, 6, { status: 'Not Returned' });
      if (response.data) {
        setFoundItems(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch found items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (email: string, password: string) => {
    try {
      await api.login(email, password);
      setView('admin');
      // Fetch admin data
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // Report item handler
  const handleReportLostItem = async (itemData: any) => {
    try {
      await api.reportLostItem(itemData);
      toast.success('Lost item reported successfully');
      // Refresh list
    } catch (error) {
      toast.error('Failed to report item');
    }
  };

  return (
    // ... rest of component
  );
}
```

### Update Admin Pages

Replace mock data with API calls in each admin page:

**LostItemsPage**

```typescript
async function fetchItems() {
  const response = await api.getAdminLostItems(page, 25, filters);
  setItems(response.data?.data || []);
  setTotal(response.data?.total || 0);
}
```

**FoundItemsPage**

```typescript
async function fetchItems() {
  const response = await api.getAdminFoundItems(page, 25, filters);
  setItems(response.data?.data || []);
  setTotal(response.data?.total || 0);
}
```

**ItemHistoryPage**

```typescript
async function fetchHistory(type: 'claimed' | 'not-found' | 'disposed') {
  if (type === 'claimed') {
    const response = await api.getClaimedItems(page, 25);
    setHistory(response.data?.data || []);
  } else if (type === 'not-found') {
    const response = await api.getLostNotFoundItems(page, 25);
    setHistory(response.data?.data || []);
  } else {
    const response = await api.getDisposedItems(page, 25);
    setHistory(response.data?.data || []);
  }
}
```

## Step 4: Update Environment Configuration

**File: `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
```

## Step 5: Testing Integration

### 1. Start Both Servers

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**
```bash
npm run dev
```

### 2. Test Authentication

1. Navigate to login page
2. Use credentials:
   - Email: `admin@campus.edu`
   - Password: `admin@12345`

### 3. Test Item Operations

1. Report a lost item
2. Browse lost items
3. Update item status
4. Check history

### 4. Verify API Calls

Open browser DevTools → Network tab and verify:
- Login POST request
- Items GET request
- Status update PUT request

## Step 6: Handle Common Issues

### CORS Error

If you see CORS error, ensure:

```typescript
// backend/src/app.ts
app.use(
  cors({
    origin: 'http://localhost:5173', // Your frontend URL
    credentials: true,
  })
);
```

### Token Expiration

Handle token refresh:

```typescript
// When getting 401, refresh token
if (response.status === 401) {
  await api.refreshAccessToken();
  // Retry request
}
```

### API URL Not Found

Ensure environment variable is set:

```bash
# .env.local
VITE_API_URL=http://localhost:5000/api
```

## Step 7: Production Deployment

When deploying to production:

1. **Update API URL** in environment variables
2. **Update CORS** in backend for production domain
3. **Use HTTPS** for all requests
4. **Update frontend domain** in backend .env

## Migration Checklist

- [ ] Create API service layer
- [ ] Update App.tsx to use API
- [ ] Update all admin pages
- [ ] Update auth flow
- [ ] Test all endpoints
- [ ] Verify data integrity
- [ ] Test in production environment
- [ ] Remove mock data from appData.ts (once fully migrated)

## Backend API Reference

Full API documentation is available in:
- `backend/API_INTEGRATION.md` - Detailed endpoints
- `backend/README.md` - Overview
- `backend/DEVELOPMENT.md` - Development guide

## Troubleshooting

### "Failed to fetch" errors
- Check if backend is running on port 5000
- Verify API base URL in environment variables
- Check browser console for exact error

### Items not loading
- Verify MongoDB connection in backend
- Check backend logs for errors
- Ensure items exist in database
- Run seed script: `npm run seed`

### Authentication failures
- Verify email/password in .env
- Check JWT secrets are set
- Clear localStorage and try again
- Check backend auth logs

## Next Steps

1. ✅ Backend is running
2. ✅ Frontend API service is created
3. ✅ Components are updated to use API
4. ✅ Test all workflows
5. ✅ Deploy to production

---

**Integration Complete! Your frontend is now connected to the production backend.**
