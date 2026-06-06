# Deployment Guide

## Production Deployment Checklist

### Pre-Deployment

- [ ] Update all environment variables in `.env`
- [ ] Change default admin password
- [ ] Update JWT secrets (generate new secure keys)
- [ ] Configure MongoDB Atlas IP whitelist
- [ ] Test all endpoints in production environment
- [ ] Enable HTTPS
- [ ] Set up rate limiting appropriately
- [ ] Configure CORS for production frontend URL
- [ ] Set up monitoring and logging

### Environment Variables

```bash
# Production .env file
NODE_ENV=production
PORT=5000

# MongoDB (Atlas Cluster)
MONGODB_URI=mongodb+srv://user:password@production-cluster.mongodb.net/campus-lost-found?retryWrites=true&w=majority

# JWT Secrets (Generate random secure strings)
JWT_SECRET=your_super_secure_random_string_here_min_32_chars
JWT_REFRESH_SECRET=your_super_secure_refresh_random_string_min_32_chars
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Cloudinary (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (CORS)
FRONTEND_URL=https://campus-lost-found.edu

# Admin Credentials (Change immediately after first login)
ADMIN_EMAIL=admin@campus.edu
ADMIN_PASSWORD=change_this_to_strong_password
```

### Deployment Options

## Option 1: Docker Container Deployment

### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install --production

# Copy source code and build
COPY . .
RUN npm run build

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["npm", "start"]
```

### Deploy with Docker

```bash
# Build image
docker build -t campus-lost-found-backend:latest .

# Run container
docker run -d \
  --name campus-backend \
  -p 5000:5000 \
  --env-file .env.production \
  campus-lost-found-backend:latest

# View logs
docker logs -f campus-backend
```

## Option 2: Railway.app Deployment

1. **Connect GitHub Repository**
   - Go to railway.app
   - Create new project
   - Connect GitHub repo

2. **Configure Environment**
   - Add all environment variables in Railway dashboard
   - Set `NODE_ENV=production`
   - Set `PORT=5000`

3. **Deploy**
   - Railway auto-deploys on git push
   - View deployment logs in dashboard

## Option 3: Heroku Deployment

1. **Install Heroku CLI**
   ```bash
   brew install heroku
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   heroku create campus-lost-found-backend
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=mongodb+srv://...
   heroku config:set JWT_SECRET=your_secret
   # ... set all other variables
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

## Option 4: DigitalOcean App Platform

1. **Connect GitHub Repo**
   - Go to DigitalOcean App Platform
   - Connect GitHub repository

2. **Configure**
   - Set environment variables
   - Configure build command: `npm run build`
   - Configure run command: `npm start`

3. **Deploy**
   - Click "Deploy"
   - Monitor in dashboard

## Option 5: Self-Hosted (VPS)

### Prerequisites

- Ubuntu 20.04+ or similar
- Node.js 18+
- MongoDB (or use MongoDB Atlas)
- Nginx (reverse proxy)
- PM2 (process manager)

### Setup Steps

```bash
# 1. Connect to server
ssh root@your_server_ip

# 2. Update system
apt update && apt upgrade -y

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# 4. Install PM2
npm install -g pm2

# 5. Clone repository
git clone <your-repo-url> /var/www/backend
cd /var/www/backend

# 6. Install dependencies
npm install --production

# 7. Build project
npm run build

# 8. Create .env file
nano .env
# Add all production environment variables

# 9. Start with PM2
pm2 start dist/server.js --name "campus-backend"
pm2 startup
pm2 save

# 10. Configure Nginx
nano /etc/nginx/sites-available/campus-backend
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.campus-lost-found.edu;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable SSL with Let's Encrypt

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d api.campus-lost-found.edu
```

## Post-Deployment

### Health Check

```bash
curl https://api.campus-lost-found.edu/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T12:00:00Z"
}
```

### Test Login

```bash
curl -X POST https://api.campus-lost-found.edu/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@campus.edu",
    "password": "your_password"
  }'
```

### Monitor Logs

```bash
# Docker
docker logs -f campus-backend

# PM2
pm2 logs

# Heroku
heroku logs --tail
```

## Performance Optimization

### Database

- Enable MongoDB Atlas auto-scaling
- Set up appropriate indexes (already done in models)
- Configure backup schedule
- Monitor Atlas metrics

### Server

- Enable gzip compression (in Helmet)
- Use CDN for static assets
- Implement caching headers
- Monitor server resources
- Set up auto-scaling if needed

### Code

- Production builds are minified
- Source maps disabled in production
- Rate limiting enabled
- Error logging configured

## Monitoring & Logging

### Set Up Monitoring

1. **Error Tracking**
   - Sentry.io integration (optional)
   - Rollbar.com (optional)
   - CloudWatch (AWS)

2. **Performance Monitoring**
   - New Relic
   - DataDog
   - Prometheus + Grafana

3. **Uptime Monitoring**
   - UptimeRobot
   - Pingdom
   - Freshping

### Logging Strategy

```typescript
// All logs are sent to console
// Configure your deployment platform to:
// 1. Aggregate logs
// 2. Send alerts on errors
// 3. Archive logs for auditing
```

## Backup & Recovery

### MongoDB Atlas

- Automated daily backups enabled
- Point-in-time recovery available
- Manual snapshots before major changes

### Code

- All code in Git with history
- Tags for each production release
- Rollback procedure tested

## Security Checklist

- [ ] HTTPS enabled (SSL/TLS)
- [ ] JWT secrets are strong and unique
- [ ] Admin password changed from default
- [ ] Database credentials secured
- [ ] MongoDB IP whitelist configured
- [ ] Rate limiting enabled
- [ ] CORS configured for production domain
- [ ] Helmet.js security headers enabled
- [ ] No sensitive data in logs
- [ ] Environment variables not in version control
- [ ] Regular security updates applied
- [ ] Monitoring and alerting configured

## Troubleshooting

### 500 Server Error

1. Check application logs
2. Verify environment variables
3. Check MongoDB connection
4. Review error middleware output

### Slow API Responses

1. Check database query performance
2. Monitor server resource usage
3. Review rate limiting
4. Check network latency

### Database Connection Issues

1. Verify MongoDB URI
2. Check IP whitelist in MongoDB Atlas
3. Verify credentials
4. Test connection string locally

## Scaling

### Horizontal Scaling

- Deploy multiple instances behind load balancer
- Use session storage (Redis) if implementing
- Ensure stateless application (already designed)

### Vertical Scaling

- Increase server RAM/CPU
- Optimize database indexes
- Implement caching layer

## Regular Maintenance

- [ ] Weekly: Monitor logs and errors
- [ ] Monthly: Review performance metrics
- [ ] Quarterly: Security audit
- [ ] Annually: Plan upgrades and improvements
- [ ] Always: Apply security patches

---

For help, refer to the main README.md or contact DevOps team.
