# Deployment Guide

## Local Development

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173 (or next available port)
- Backend: http://localhost:3001

## Production Deployment

### Option 1: Docker + Cloud Run (Recommended)

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build frontend
RUN npm run build

# Expose ports
EXPOSE 3001

# Start server
CMD ["npm", "start"]
```

Deploy to Google Cloud Run:

```bash
gcloud run deploy gemini-upscaler \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars GEMINI_API_KEY=your_key_here,PORT=3001
```

### Option 2: Vercel (Frontend) + Cloud Run (Backend)

**Frontend (Vercel):**
```bash
vercel build && vercel deploy --prod
```

**Backend (Cloud Run):**
```bash
gcloud run deploy gemini-upscaler \
  --source ./server.ts \
  --runtime nodejs20 \
  --set-env-vars GEMINI_API_KEY=your_key_here
```

Update `VITE_BACKEND_URL` in Vercel environment variables to point to Cloud Run backend.

### Option 3: Self-hosted (VPS/Dedicated Server)

```bash
# SSH into server
ssh user@your-server.com

# Clone repo
git clone <your-repo>
cd Gemini-IA-Upscaler

# Install & build
npm install
npm run build:server

# Run with PM2
npm install -g pm2
pm2 start npm --name "gemini-upscaler" -- start
pm2 save
```

Setup reverse proxy with nginx:

```nginx
upstream backend {
    server localhost:3001;
}

server {
    listen 80;
    server_name upscaler.example.com;

    # Serve static frontend files
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Environment Variables

**Production checklist:**

```env
# Required
GEMINI_API_KEY=your_secret_key

# Optional (defaults provided)
PORT=3001
VITE_BACKEND_URL=https://api.upscaler.example.com
NODE_ENV=production
```

**SECURITY:**
- Never commit `.env.local` or similar files
- Use platform secrets management (Cloud Run secret manager, GitHub secrets, etc.)
- Rotate API keys regularly
- Enable CORS only for your domain

## Monitoring

Add health check endpoint:

```bash
curl http://localhost:3001/health
# Response: {"status":"ok"}
```

Setup monitoring:
- CPU/Memory usage
- API error rate
- Response times
- Quota usage

## Cost Optimization

1. **Cache results** (Redis/Memcached)
   - Cache frequent upscales by image hash
   - TTL: 24 hours

2. **Rate limiting**
   - Implement per-user limits
   - Free tier: 5 req/hour
   - Pro tier: 100 req/hour

3. **Image size limits**
   - Current: 10MB max
   - Consider reducing for mobile

4. **Batch processing**
   - Queue long requests
   - Process during off-peak hours

## Scaling

As demand grows:

1. **Horizontal scaling**
   ```bash
   # Load balancer → multiple backend instances
   # Use process manager (PM2, systemd, Kubernetes)
   ```

2. **Caching layer**
   ```bash
   # Redis for result caching
   npm install redis
   ```

3. **Queue system**
   ```bash
   # Bull/BullMQ for long requests
   npm install bull
   ```

4. **CDN**
   - CloudFlare for frontend caching
   - Google Cloud CDN for API responses
