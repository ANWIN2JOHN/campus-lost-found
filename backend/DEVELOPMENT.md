# Development Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
# or
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your local settings:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campus-lost-found
# or MongoDB Atlas URL
JWT_SECRET=your_dev_secret_key
JWT_REFRESH_SECRET=your_dev_refresh_secret
FRONTEND_URL=http://localhost:5173
```

### 3. Start Development Server

```bash
npm run dev
```

Server will start at `http://localhost:5000` with hot reload enabled.

## Development Workflow

### Adding a New Feature

1. **Create Model** (if needed)
   ```typescript
   // src/models/NewFeature.ts
   import mongoose, { Schema, Document } from "mongoose";
   
   interface INewFeature extends Document { /* ... */ }
   
   const newFeatureSchema = new Schema<INewFeature>({
     // ... schema definition
   });
   
   export const NewFeature = mongoose.model<INewFeature>(
     "NewFeature",
     newFeatureSchema
   );
   ```

2. **Create Service** (business logic)
   ```typescript
   // src/services/NewFeatureService.ts
   import { NewFeature } from "../models/index.js";
   
   export class NewFeatureService {
     static async create(data: any) {
       // Implementation
     }
   }
   ```

3. **Create Controller** (HTTP handlers)
   ```typescript
   // src/controllers/NewFeatureController.ts
   export class NewFeatureController {
     static async create(req: Request, res: Response) {
       // Implementation
     }
   }
   ```

4. **Create Routes**
   ```typescript
   // src/routes/newFeature.ts
   router.post("/", validateRequest(schema), catchAsync(Controller.create));
   ```

5. **Update App Routes**
   ```typescript
   // src/app.ts
   app.use("/api/new-feature", newFeatureRoutes);
   ```

## Code Style & Best Practices

### TypeScript

```typescript
// ✅ Good
interface IUser {
  id: string;
  name: string;
}

class UserService {
  static async getUser(id: string): Promise<IUser> {
    // Implementation
  }
}

// ❌ Bad
const getUser = (id) => {
  // No types
};
```

### Error Handling

```typescript
// ✅ Good - Use custom error classes
import { NotFoundError, ValidationError } from "../utils/errors.js";

throw new NotFoundError("User");
throw new ValidationError("Invalid email");

// ❌ Bad
throw new Error("User not found");
```

### Async/Await

```typescript
// ✅ Good
export async function someHandler(req: Request, res: Response): Promise<void> {
  const data = await getData();
  res.json(data);
}

// ❌ Bad - Using .then()
getData().then(data => {
  res.json(data);
});
```

### Logging

```typescript
// ✅ Good
import { Logger } from "../utils/logger.js";

Logger.info("User created successfully");
Logger.error("Failed to create user", error);

// ❌ Bad
console.log("User created");
```

## Testing

### Manual Testing with curl

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campus.edu","password":"admin@12345"}'

# Report Lost Item
curl -X POST http://localhost:5000/api/items/lost/report \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Blue Backpack",
    "description": "Navy blue backpack",
    "category": "Bags & Backpacks",
    "location": "Library",
    "dateLost": "2024-01-20T10:00:00Z",
    "contactType": "student",
    "studentName": "John Doe",
    "rollNo": "2024001",
    "studentPhone": "+91-9876543210",
    "studentEmail": "john@campus.edu"
  }'

# Get Lost Items
curl http://localhost:5000/api/items/lost?page=1&limit=6

# Update Item Status (Protected)
curl -X PUT http://localhost:5000/api/items/lost/:id \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"Returned"}'
```

### Using Postman/Insomnia

1. Import endpoints from `API_INTEGRATION.md`
2. Set up environment variables
3. Test each endpoint
4. Verify responses

## Database Operations

### Seed Database

```bash
npm run seed
```

Populates database with sample data for testing.

### Clear Database

```bash
# MongoDB CLI (local)
mongo campus-lost-found
db.users.deleteMany({})
db.lostitems.deleteMany({})
db.founditems.deleteMany({})

# Or use MongoDB Compass UI
```

## Debugging

### Enable Debug Logging

The server already has DEBUG mode for development:

```bash
NODE_ENV=development npm run dev
```

Look for `[DEBUG]` messages in console output.

### Visual Studio Code Debugging

1. Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "program": "${workspaceFolder}/src/server.ts",
      "preLaunchTask": "tsc: build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "sourceMaps": true
    }
  ]
}
```

2. Set breakpoints and press F5 to debug

### Common Issues

**Port Already in Use**
```bash
# Find process on port 5000
lsof -i :5000

# Kill process
kill -9 PID
```

**MongoDB Connection Failed**
- Check `MONGODB_URI` in `.env`
- Verify MongoDB is running
- Check network connectivity

**Module Not Found**
```bash
# Clear and reinstall
rm -rf node_modules
npm install
```

## Version Control

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### Commit Message Format

```
feat: add new feature description
fix: fix bug description
docs: documentation update
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

## Environment Variables

### Development (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campus-lost-found
JWT_SECRET=dev-secret-key-not-secure
JWT_REFRESH_SECRET=dev-refresh-secret
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=admin@campus.edu
ADMIN_PASSWORD=admin@12345
```

### Production (.env.production)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=secure_random_string_here
JWT_REFRESH_SECRET=secure_random_string_here
FRONTEND_URL=https://campus-lost-found.edu
ADMIN_EMAIL=admin@campus.edu
ADMIN_PASSWORD=strong_secure_password
```

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Compile TypeScript
npm start                # Run compiled server

# Maintenance
npm run lint             # Check code style
npm run seed             # Populate with sample data

# Production
npm run build
npm start
```

## IDE Setup

### VS Code Extensions

- ESLint
- Prettier
- MongoDB for VS Code
- REST Client
- Thunder Client

### Recommended Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Introduction](https://jwt.io/introduction)

---

For production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md)
