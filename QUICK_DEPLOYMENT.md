# Patria Backend - Quick Production Deployment

## 5-Minute Setup (Ubuntu VPS)

### Prerequisites
- Ubuntu 20.04+ VPS with root/sudo access
- MongoDB Atlas account + cluster created
- Domain name (optional)

---

## Fast Track Deployment

### 1. SSH into your VPS
```bash
ssh root@YOUR_VPS_IP
```

### 2. Download and run deployment script
```bash
cd /tmp
wget https://raw.githubusercontent.com/asaid-cmd/patria-backend-1/main/scripts/deploy.sh
chmod +x deploy.sh
sudo ./deploy.sh
```

Or if you cloned the repo:
```bash
cd /var/www/patria-backend
sudo bash scripts/deploy.sh
```

### 3. Configure environment variables
```bash
nano /var/www/patria-backend/.env
```

**Edit these critical values:**
```env
MONGODB_URI=mongodb+srv://patria_user:PASSWORD@cluster.mongodb.net/patria?retryWrites=true&w=majority
JWT_ACCESS_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_REFRESH_SECRET=<generate same as above>
CORS_ORIGIN=https://yourdomain.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

Save (Ctrl+X, then Y, then Enter)

### 4. Restart application
```bash
pm2 restart patria-backend
```

### 5. Test it's running
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"ok","timestamp":"2026-05-12T..."}
```

### 6. Setup SSL (if using domain)
```bash
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
```

### 7. Update Nginx config with domain
```bash
sudo nano /etc/nginx/sites-available/patria-backend
```

Change `server_name _;` to:
```nginx
server_name yourdomain.com www.yourdomain.com;
```

Add SSL section:
```nginx
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

Reload:
```bash
sudo nginx -s reload
```

### 8. Point your domain DNS to VPS IP
In your domain registrar, set:
- A record: `yourdomain.com` → `YOUR_VPS_IP`
- A record: `www.yourdomain.com` → `YOUR_VPS_IP`

---

## Verification

✅ API is running:
```bash
curl https://yourdomain.com/api/health
```

✅ Swagger UI:
```
https://yourdomain.com/api-docs
```

✅ App logs:
```bash
pm2 logs patria-backend
```

✅ Status:
```bash
pm2 status
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| `502 Bad Gateway` | `pm2 status` - App not running, check logs with `pm2 logs` |
| `MongoDB connection error` | Verify IP whitelist in MongoDB Atlas + connection string in .env |
| `SSL certificate not found` | Ensure domain is pointing to VPS IP, then rerun certbot |
| `Port already in use` | `sudo lsof -i :5000` and kill the process |

---

## Useful Commands

```bash
# View app logs
pm2 logs patria-backend

# Restart after .env changes
pm2 restart patria-backend

# Stop app
pm2 stop patria-backend

# Pull latest code from GitHub
cd /var/www/patria-backend && git pull origin main && npm install && pm2 restart patria-backend

# Check Nginx status
sudo systemctl status nginx

# View Nginx error log
sudo tail -f /var/log/nginx/error.log

# Renew SSL certificate
sudo certbot renew --force-renewal

# View real-time resources
pm2 monit
```

---

## Next: Frontend Integration

Frontend dev should:
1. Use `https://yourdomain.com/api` as base URL
2. Import `postman_collection.json` for testing
3. Refer to `FOR_FRONTEND_DEVELOPER.md` for API docs
4. Test WebSocket at `https://yourdomain.com`

---

## Full Documentation

For detailed setup, troubleshooting, and configuration options, see:
- **DEPLOYMENT_GUIDE.md** - Complete step-by-step guide
- **FOR_FRONTEND_DEVELOPER.md** - API integration guide
- **README.md** - Full project documentation

---

**Your API is now live! 🚀**
