# Production Deployment Checklist

Use this checklist to ensure everything is properly configured before going live.

---

## Pre-Deployment (Local Machine)

- [ ] All code committed to GitHub
- [ ] CLAUDE.md reviewed
- [ ] README.md updated with current info
- [ ] package.json dependencies are current (`npm audit`)
- [ ] No `.env` files committed
- [ ] `.gitignore` includes: node_modules, .env*, uploads/
- [ ] ESLint passes: `npm run lint`
- [ ] Code formatted: `npm run format`
- [ ] Tests pass (if applicable): `npm test`

---

## VPS Setup

### System & Node
- [ ] Ubuntu 20.04 or 22.04 installed
- [ ] System updated: `apt update && apt upgrade -y`
- [ ] Node.js 18 LTS installed: `node --version`
- [ ] Git installed: `git --version`
- [ ] App directory created: `/var/www/patria-backend`

### Repository & Dependencies
- [ ] Code cloned from GitHub
- [ ] Dependencies installed: `npm install`
- [ ] Verify no build errors

### Environment Configuration
- [ ] `.env` file created with production values
- [ ] `MONGODB_URI` set to MongoDB Atlas connection string
- [ ] `JWT_ACCESS_SECRET` set to random 32+ char string
- [ ] `JWT_REFRESH_SECRET` set to random 32+ char string
- [ ] `CORS_ORIGIN` set to frontend domain (e.g., https://yourdomain.com)
- [ ] `SMTP_*` variables configured for email service
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000`
- [ ] All required variables set (no empty values)

### Process Management
- [ ] PM2 installed: `npm install -g pm2`
- [ ] App started: `pm2 start server.js --name "patria-backend" --env production`
- [ ] PM2 startup configured: `pm2 startup` and `pm2 save`
- [ ] App auto-restarts on reboot
- [ ] Health check passing: `curl http://localhost:5000/api/health`

---

## Web Server Setup

### Nginx
- [ ] Nginx installed: `apt install nginx`
- [ ] Nginx config created: `/etc/nginx/sites-available/patria-backend`
- [ ] Site enabled: symlink to sites-enabled
- [ ] Default site disabled: removed from sites-enabled
- [ ] Nginx config valid: `nginx -t`
- [ ] Nginx started: `systemctl start nginx`
- [ ] Nginx enabled on reboot: `systemctl enable nginx`

### WebSocket & Reverse Proxy
- [ ] Nginx configured for Socket.IO
- [ ] Upgrade headers set for WebSockets
- [ ] Connection: upgrade header configured
- [ ] Proxy headers correctly set
- [ ] `/socket.io` location configured
- [ ] `/api/` proxy pass configured
- [ ] File upload path configured (if using local storage)

---

## SSL/TLS Encryption

- [ ] Certbot installed: `apt install certbot python3-certbot-nginx`
- [ ] Domain DNS pointing to VPS IP
- [ ] SSL certificate obtained: `certbot certonly --nginx -d domain.com`
- [ ] Certificate paths correct in Nginx config
- [ ] HTTP → HTTPS redirect configured
- [ ] SSL protocols limited to TLS 1.2+
- [ ] Certificate auto-renewal enabled: `certbot renew --dry-run`
- [ ] HTTPS test passing: `curl https://yourdomain.com/api/health`

---

## Database & Backups

### MongoDB Atlas
- [ ] Cluster created and running
- [ ] Database user created with proper permissions
- [ ] IP whitelist configured (VPS IP added)
- [ ] Connection string correct in .env
- [ ] Database connection test passing
- [ ] Authentication verified

### Backups
- [ ] MongoDB Atlas automatic backups enabled
- [ ] Backup frequency: every 6 hours minimum
- [ ] Backup retention: 30 days minimum
- [ ] Tested backup restoration process

---

## Security Configuration

### Headers & Policies
- [ ] Helmet enabled (check app.js)
- [ ] CORS restricted to frontend domain
- [ ] X-Frame-Options set to DENY
- [ ] X-Content-Type-Options set to nosniff
- [ ] Strict-Transport-Security header set
- [ ] CSP headers configured (if needed)

### Rate Limiting
- [ ] Rate limiter configured in middleware
- [ ] Limits appropriate for production
- [ ] `/api/auth/login` rate limited
- [ ] `/api/auth/register` rate limited

### File Uploads
- [ ] File type restrictions in place
- [ ] File size limits configured (5MB default)
- [ ] Uploads directory not web-accessible
- [ ] Uploaded files served with proper headers
- [ ] No executable file types allowed

### JWT Tokens
- [ ] Access token TTL: 15 minutes
- [ ] Refresh token TTL: 7 days
- [ ] Secrets stored in .env only
- [ ] Secrets are random & strong (32+ chars)
- [ ] Secrets differ between access and refresh tokens

---

## Monitoring & Logging

### PM2 Monitoring
- [ ] PM2 status checking: `pm2 status`
- [ ] Logs accessible: `pm2 logs patria-backend`
- [ ] Log rotation configured
- [ ] Critical errors trigger alerts (optional)

### Nginx Logging
- [ ] Access log rotating
- [ ] Error log monitoring
- [ ] Log retention policy set

### Application Logs
- [ ] Error logging implemented
- [ ] Request logging via Morgan (configured in app.js)
- [ ] Sensitive data not logged (passwords, tokens)

---

## API Verification

### Core Endpoints
- [ ] `GET /api/health` returns 200
- [ ] `POST /api/auth/login` works with valid credentials
- [ ] `POST /api/auth/register` creates new admin user
- [ ] `GET /api/auth/me` requires valid JWT
- [ ] `GET /api-docs` Swagger UI loads
- [ ] Invalid JWT returns 401

### Key Modules
- [ ] Products module working
- [ ] Orders module working
- [ ] Customers module working
- [ ] Kitchen orders module working
- [ ] Shifts module working
- [ ] Transactions module working

### WebSocket
- [ ] Socket.IO connects
- [ ] Kitchen room joins successfully
- [ ] Order updates broadcast correctly
- [ ] Disconnect handling works

---

## Frontend Integration

- [ ] Frontend base URL set to `https://yourdomain.com/api`
- [ ] Frontend developer has access to:
  - [ ] FOR_FRONTEND_DEVELOPER.md
  - [ ] postman_collection.json
  - [ ] API documentation (Swagger UI)
- [ ] Frontend tested against live API
- [ ] JWT tokens handled correctly on frontend
- [ ] Refresh token flow working
- [ ] WebSocket connection working
- [ ] File uploads working

---

## Performance

### Optimization
- [ ] Gzip compression enabled in Nginx
- [ ] Database queries optimized (indexes in place)
- [ ] API response times < 500ms
- [ ] Swagger UI loads in < 2s
- [ ] No N+1 queries

### Load Testing (Optional)
- [ ] Basic load test performed: `ab -n 100 -c 10 https://yourdomain.com/api/health`
- [ ] API handles 10 concurrent requests
- [ ] No memory leaks detected: `pm2 monit`

---

## Maintenance & Operations

### Routine Tasks
- [ ] Daily log review process established
- [ ] Weekly dependency update check (`npm audit`)
- [ ] Monthly SSL certificate renewal test
- [ ] Quarterly database backup restoration test
- [ ] Backup retention policy documented

### Emergency Procedures
- [ ] Rollback procedure documented
- [ ] Database restoration procedure documented
- [ ] Zero-downtime deployment method decided
- [ ] Emergency contact information available

---

## Documentation

- [ ] DEPLOYMENT_GUIDE.md reviewed
- [ ] QUICK_DEPLOYMENT.md bookmarked
- [ ] README.md production instructions clear
- [ ] Environment variables documented
- [ ] API endpoints documented in Swagger
- [ ] Known issues logged
- [ ] Support procedure documented

---

## Final Verification

- [ ] All endpoints tested in Postman
- [ ] Swagger UI fully functional
- [ ] Error handling works correctly
- [ ] Permission system working
- [ ] File uploads/downloads working
- [ ] Email notifications functional
- [ ] WebSocket real-time updates working
- [ ] Database backups working
- [ ] SSL certificate valid & not expiring soon

---

## Go-Live

- [ ] All checkboxes above completed
- [ ] Team has access to documentation
- [ ] Monitoring dashboard set up
- [ ] On-call support procedure established
- [ ] 24/7 monitoring enabled (optional)
- [ ] Incident response plan ready

**Date Deployed**: _________________  
**Deployed By**: _________________  
**Version**: _________________  
**Status**: ✅ **LIVE**

---

## Post-Deployment (First 24 Hours)

- [ ] Monitor error logs continuously
- [ ] Check real-time user activity
- [ ] Verify all critical features
- [ ] Monitor database size growth
- [ ] Check API response times
- [ ] Monitor server resources (CPU, RAM, Disk)
- [ ] Test backup restoration process
- [ ] Gather initial user feedback

---

**Deployment Status**: Ready for Production  
**Last Updated**: 2026-05-12
