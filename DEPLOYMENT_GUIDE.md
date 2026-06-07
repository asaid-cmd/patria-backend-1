# Patria Backend - Production Deployment Guide

## Overview
This guide covers deploying the Patria Backend API to an Ubuntu VPS with MongoDB Atlas, PM2 process manager, and Nginx reverse proxy.

**Prerequisites:**
- Ubuntu 20.04 or 22.04 VPS with SSH access
- Domain name (optional but recommended)
- MongoDB Atlas account and cluster
- 1GB+ RAM recommended for VPS

---

## Step 1: MongoDB Atlas Setup

### 1.1 Create MongoDB Atlas Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account or login
3. Create a new project
4. Build a cluster (free tier: M0)
5. Choose region close to your VPS location
6. Wait for cluster to be ready (~10 minutes)

### 1.2 Set Up Database User
1. Go to "Database Access" in left menu
2. Click "Add New Database User"
3. Create username: `patria_user`
4. Create strong password (save it!)
5. Select "Specific Privileges" → Select Database: `patria`
6. Click "Add User"

### 1.3 Add IP Whitelist
1. Go to "Network Access" in left menu
2. Click "Add IP Address"
3. Choose one:
   - **Option A (Simple)**: Allow 0.0.0.0/0 (anyone) - less secure
   - **Option B (Recommended)**: Add your VPS IP address only
4. Click "Confirm"

### 1.4 Get Connection String
1. Click "Connect" button on your cluster
2. Select "Drivers"
3. Choose Node.js driver
4. Copy the connection string - you'll need this
5. Replace `<password>` with your database user password
6. URL format: `mongodb+srv://patria_user:PASSWORD@cluster.mongodb.net/patria?retryWrites=true&w=majority`

---

## Step 2: VPS Setup (Ubuntu 20.04/22.04)

### 2.1 SSH into Your Server
```bash
ssh root@YOUR_SERVER_IP
# or
ssh username@YOUR_SERVER_IP
```

### 2.2 Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### 2.3 Install Node.js (v18 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # Should show v18.x.x
npm --version    # Should show 9.x.x
```

### 2.4 Install Git
```bash
sudo apt install -y git
```

### 2.5 Create App Directory
```bash
sudo mkdir -p /var/www/patria-backend
cd /var/www/patria-backend
sudo chown $USER:$USER /var/www/patria-backend
```

---

## Step 3: Clone and Setup Project

### 3.1 Clone Repository
```bash
cd /var/www/patria-backend
git clone https://github.com/asaid-cmd/patria-backend-1.git .
```

### 3.2 Install Dependencies
```bash
npm install
```

### 3.3 Create Production .env File
```bash
sudo nano .env.production
```

Add the following (update with your actual values):
```env
# Server
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://patria_user:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/patria?retryWrites=true&w=majority

# JWT Secrets (CHANGE THESE!)
JWT_ACCESS_SECRET=your_super_secret_access_key_production_change_this
JWT_REFRESH_SECRET=your_super_secret_refresh_key_production_change_this

# CORS
CORS_ORIGIN=https://YOUR_FRONTEND_DOMAIN.com

# Email (Nodemailer - Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourapp.com

# WhatsApp API (Optional)
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_KEY=your_api_key

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important**: For JWT secrets and SMTP pass, use strong random values:
```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.4 Copy .env to Production
```bash
cp .env.production .env
```

---

## Step 4: Install and Configure PM2

### 4.1 Install PM2 Globally
```bash
sudo npm install -g pm2
```

### 4.2 Start App with PM2
```bash
cd /var/www/patria-backend
pm2 start server.js --name "patria-backend" --env production
```

### 4.3 Make PM2 Startup on Reboot
```bash
pm2 startup
# Copy and run the command it outputs
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
pm2 save
```

### 4.4 Verify PM2 Status
```bash
pm2 status
pm2 logs patria-backend  # View live logs
```

---

## Step 5: Install and Configure Nginx

### 5.1 Install Nginx
```bash
sudo apt install -y nginx
```

### 5.2 Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/patria-backend
```

Paste this config (update domain):
```nginx
upstream patria_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;

    # SSL certificates (from Let's Encrypt - set up in step 6)
    ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # API endpoints
    location /api/ {
        proxy_pass http://patria_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://patria_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Swagger docs
    location /api-docs {
        proxy_pass http://patria_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /api/health {
        proxy_pass http://patria_backend;
        proxy_set_header Host $host;
    }

    # File uploads
    location /uploads/ {
        alias /var/www/patria-backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### 5.3 Enable Nginx Site
```bash
sudo ln -s /etc/nginx/sites-available/patria-backend /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
```

### 5.4 Test Nginx Configuration
```bash
sudo nginx -t
# Should output: syntax is ok, test is successful
```

### 5.5 Start Nginx
```bash
sudo systemctl start nginx
sudo systemctl enable nginx  # Enable on reboot
```

---

## Step 6: SSL/TLS Certificate with Let's Encrypt

### 6.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 Get Certificate
```bash
sudo certbot certonly --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com
```

Follow the prompts:
- Enter email for renewal notifications
- Accept terms
- Choose email sharing preference

### 6.3 Auto-Renewal
```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
sudo certbot renew --dry-run  # Test renewal
```

### 6.4 Update Nginx Config with Certificate Paths
The certificate paths in your Nginx config should now be valid.

---

## Step 7: Verify Deployment

### 7.1 Test API Health
```bash
curl https://YOUR_DOMAIN.com/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 7.2 Check Logs
```bash
# PM2 logs
pm2 logs patria-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 7.3 Monitor Resources
```bash
pm2 monit
# Shows real-time CPU, memory usage
```

### 7.4 Test Swagger UI
```
https://YOUR_DOMAIN.com/api-docs
```

### 7.5 Test WebSocket (Optional)
Open browser console and test:
```javascript
const socket = io('https://YOUR_DOMAIN.com');
socket.emit('kitchen:join', {});
socket.on('kitchen:new-order', (data) => console.log(data));
```

---

## Step 8: Database Backup & Maintenance

### 8.1 MongoDB Atlas Backups
In MongoDB Atlas:
1. Go to Backup in left menu
2. Enable "Automatic Backup"
3. Schedule: every 6 hours
4. Retention: 30 days

### 8.2 Application Backups
Create daily script backup:
```bash
sudo crontab -e
```

Add:
```
0 2 * * * cd /var/www/patria-backend && git pull origin main >> /var/log/patria-deploy.log 2>&1
```

---

## Step 9: Monitoring & Logging (Optional)

### 9.1 PM2 Monitoring
```bash
pm2 web  # Starts web dashboard on port 9615
# Access at http://localhost:9615
```

### 9.2 View System Logs
```bash
journalctl -u nginx -f           # Nginx logs
pm2 logs patria-backend -n 100  # Last 100 app logs
```

---

## Troubleshooting

### App won't start
```bash
pm2 logs patria-backend
# Check for MongoDB connection errors, env variable issues
```

### MongoDB connection fails
- Verify IP is whitelisted in MongoDB Atlas
- Check password in connection string
- Ensure database user has proper permissions

### Nginx returns 502 Bad Gateway
```bash
sudo systemctl status nginx
sudo nginx -t
pm2 status  # Check if app is running
```

### SSL certificate issues
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Port 80/443 already in use
```bash
sudo lsof -i :80
sudo lsof -i :443
# Kill the process and try again
```

---

## Production Checklist

- [x] MongoDB Atlas cluster created
- [x] Database user created
- [x] IP whitelist configured
- [x] VPS Ubuntu installed
- [x] Node.js 18 installed
- [x] Project cloned from GitHub
- [x] .env.production configured
- [x] PM2 installed and app running
- [x] Nginx configured as reverse proxy
- [x] SSL certificate installed
- [x] Health check verified
- [x] Domain DNS pointing to VPS
- [x] Backups configured
- [x] Monitoring set up

---

## Maintenance Commands

```bash
# Stop app
pm2 stop patria-backend

# Restart app
pm2 restart patria-backend

# Update code
cd /var/www/patria-backend && git pull origin main

# Reinstall dependencies (if needed)
npm install

# View all running apps
pm2 list

# Delete app from PM2
pm2 delete patria-backend

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx

# View live app logs
pm2 logs patria-backend
```

---

## Security Best Practices

1. **Keep dependencies updated**: `npm audit fix` monthly
2. **Monitor logs**: Set up log rotation with logrotate
3. **Rate limiting**: Configured in app (check constants.js)
4. **CORS**: Whitelist only your frontend domain
5. **JWT secrets**: Use strong, random 32+ character strings
6. **Database**: Never expose MongoDB credentials in code
7. **Uploads**: Restrict file types and sizes (done in upload.js)
8. **Environment variables**: Never commit .env file to Git
9. **HTTPS**: Always enforce (done via Nginx redirect)
10. **Backups**: Test backup restoration regularly

---

## Support & Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

**Version**: 1.0.0  
**Last Updated**: 2026-05-12  
**Status**: Ready for Production Deployment
