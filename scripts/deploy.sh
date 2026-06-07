#!/bin/bash

# Patria Backend - Production Deployment Script
# Run on Ubuntu 20.04+ VPS as root or with sudo

set -e

echo "======================================"
echo "Patria Backend Production Deployment"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   exit 1
fi

# Step 1: Update System
echo -e "${YELLOW}Step 1: Updating system...${NC}"
apt update
apt upgrade -y

# Step 2: Install Node.js
echo -e "${YELLOW}Step 2: Installing Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Step 3: Install Git
echo -e "${YELLOW}Step 3: Installing Git...${NC}"
apt install -y git

# Step 4: Create app directory
echo -e "${YELLOW}Step 4: Creating app directory...${NC}"
mkdir -p /var/www/patria-backend
cd /var/www/patria-backend

# Step 5: Clone repository (if not already cloned)
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Step 5: Cloning repository...${NC}"
    git clone https://github.com/asaid-cmd/patria-backend-1.git .
else
    echo -e "${YELLOW}Step 5: Repository already cloned, pulling latest...${NC}"
    git pull origin main
fi

# Step 6: Install dependencies
echo -e "${YELLOW}Step 6: Installing npm dependencies...${NC}"
npm install

# Step 7: Install PM2 globally
echo -e "${YELLOW}Step 7: Installing PM2...${NC}"
npm install -g pm2

# Step 8: Create .env file from example
echo -e "${YELLOW}Step 8: Setting up environment variables...${NC}"
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# MongoDB Atlas Connection
# IMPORTANT: Replace with your actual MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://patria_user:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/patria?retryWrites=true&w=majority

# JWT Secrets - CHANGE THESE TO RANDOM VALUES!
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_ACCESS_SECRET=replace_with_random_32_char_string_for_access_token
JWT_REFRESH_SECRET=replace_with_random_32_char_string_for_refresh_token

# CORS Configuration
# Set to your frontend domain in production
CORS_ORIGIN=https://yourdomain.com

# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# WhatsApp API (Optional)
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_KEY=your_api_key

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    echo -e "${RED}IMPORTANT: Edit .env file with your actual values!${NC}"
    echo "Run: nano /var/www/patria-backend/.env"
    echo ""
else
    echo ".env file already exists, skipping..."
fi

# Step 9: Start with PM2
echo -e "${YELLOW}Step 9: Starting application with PM2...${NC}"
pm2 start server.js --name "patria-backend" --env production
pm2 startup
pm2 save

# Step 10: Install Nginx
echo -e "${YELLOW}Step 10: Installing Nginx...${NC}"
apt install -y nginx

# Step 11: Configure Nginx
echo -e "${YELLOW}Step 11: Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/patria-backend << 'EOF'
upstream patria_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name _;

    location / {
        proxy_pass http://patria_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io {
        proxy_pass http://patria_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/patria-backend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t

# Start Nginx
systemctl start nginx
systemctl enable nginx

# Step 12: Install Certbot for SSL
echo -e "${YELLOW}Step 12: Installing Certbot for SSL...${NC}"
apt install -y certbot python3-certbot-nginx

echo ""
echo -e "${GREEN}======================================"
echo "Deployment Complete!"
echo "======================================${NC}"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo "1. Edit environment variables:"
echo "   nano /var/www/patria-backend/.env"
echo "   - Set MONGODB_URI with your MongoDB Atlas connection string"
echo "   - Set JWT secrets with random values"
echo "   - Configure SMTP for emails"
echo "   - Set CORS_ORIGIN to your domain"
echo ""
echo "2. Restart the app after editing .env:"
echo "   pm2 restart patria-backend"
echo ""
echo "3. Point your domain to this server's IP address (DNS)"
echo ""
echo "4. Install SSL certificate:"
echo "   certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com"
echo ""
echo "5. Update Nginx config with your domain and SSL paths:"
echo "   nano /etc/nginx/sites-available/patria-backend"
echo ""
echo "6. Test your API:"
echo "   curl http://YOUR_SERVER_IP/api/health"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  pm2 status                    # Check app status"
echo "  pm2 logs patria-backend       # View live logs"
echo "  pm2 restart patria-backend    # Restart app"
echo "  systemctl status nginx        # Check Nginx status"
echo "  sudo nginx -t                 # Test Nginx config"
echo ""
echo -e "${YELLOW}Deployment Guide:${NC}"
echo "  See DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
