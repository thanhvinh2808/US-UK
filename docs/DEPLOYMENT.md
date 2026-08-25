# V-English — Production Deployment Guide

## 1. Prerequisites
- **Node.js**: v18.0.0+ (v20 LTS recommended)
- **MongoDB**: v5.0+ (MongoDB Atlas or self-hosted with replica set support)
- **HTTPS**: Required for secure `SameSite=None` or `SameSite=Lax` Cookie handling and Web Speech API
- **Reverse Proxy**: Nginx / Caddy / Cloudflare (recommended for TLS termination and static caching)

---

## 2. Environment Configuration
Create a `.env` file based on `.env.example`:

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Security & Secrets (Must be at least 64 random characters)
JWT_SECRET=your_ultra_secure_random_64_character_jwt_secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/v_english_prod?retryWrites=true&w=majority

# AI Services
GEMINI_API_KEY=your_production_gemini_api_key

# Frontend Client
VITE_API_URL=https://api.v-english.app/api
```

---

## 3. Build & Execution

### Frontend (Static SPA):
```bash
# Install dependencies
npm ci

# Build optimized production bundle
npm run build

# The output in ./dist can be hosted via Nginx, Vercel, Netlify, or Cloudflare Pages
```

### Backend (Node.js API):
```bash
# Start server
node server/index.js
```

---

## 4. Reverse Proxy Configuration (Nginx Example)
```nginx
server {
    listen 80;
    server_name v-english.app www.v-english.app;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name v-english.app;

    ssl_certificate /etc/letsencrypt/live/v-english.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/v-english.app/privkey.pem;

    root /var/www/v-english/dist;
    index index.html;

    # SPA routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health Check
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
    }
}
```

---

## 5. Health Monitoring
- Health check URL: `GET /health`
- Expected payload:
```json
{
  "status": "OK",
  "message": "US-UK English Quizlet Server is running smooth!"
}
```

---

## 6. Rollback Strategy
1. Maintain previous release artifact directory (e.g. `/var/www/v-english/releases/v2.0.0-prev`).
2. In case of emergency:
   ```bash
   ln -sfn /var/www/v-english/releases/v2.0.0-prev /var/www/v-english/current
   systemctl reload nginx
   pm2 restart v-english-api
   ```
