# Complete Step-by-Step Deployment Guide for Hostinger VPS

## 📋 What You'll Need
- Hostinger VPS IP address
- SSH credentials (username and password)
- Your domain name (optional)
- This guide open on your screen

---

## PART 1: PREPARE YOUR LOCAL APPLICATION

### Step 1.1: Update API URL in Client

**On your Windows machine:**

1. Open file: `d:\POPEYE\rma\client\src\services\api.js`

2. Find this line:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

3. Replace with (use your VPS IP):
```javascript
const API_URL = 'http://YOUR_VPS_IP/api';
// Example: const API_URL = 'http://45.123.456.789/api';
```

4. Save the file

### Step 1.2: Build the Client Application

**Open PowerShell in Windows:**

```powershell
# Navigate to client folder
cd d:\POPEYE\rma\client

# Build the application
npm run build

# Wait for build to complete (should see "✓ built in X seconds")
```

### Step 1.3: Prepare Server Environment File

1. Open file: `d:\POPEYE\rma\server\.env`

2. Update it with production values:
```env
PORT=5000
NODE_ENV=production

DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db
DB_USER=crm_user
DB_PASSWORD=YourStrongPassword123!

JWT_SECRET=your_very_long_random_secret_key_minimum_32_characters_long

CORS_ORIGIN=http://YOUR_VPS_IP
```

3. Save the file

---

## PART 2: CONNECT TO YOUR VPS

### Step 2.1: Get Your VPS Credentials

From Hostinger:
- VPS IP Address: `_______________`
- SSH Username: `_______________` (usually 'root')
- SSH Password: `_______________`

### Step 2.2: Connect via SSH

**Open PowerShell and run:**

```powershell
ssh root@YOUR_VPS_IP
# Example: ssh root@45.123.456.789

# Type 'yes' when asked about fingerprint
# Enter your password when prompted
```

**You should now see something like:** `root@vps-xxxxx:~#`

---

## PART 3: SETUP VPS SERVER

### Step 3.1: Update System

**Copy and paste these commands one by one:**

```bash
# Update package list
sudo apt update

# Upgrade installed packages (this may take 5-10 minutes)
sudo apt upgrade -y
```

### Step 3.2: Install Node.js

```bash
# Download Node.js setup script
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version
# Should show: v18.x.x

npm --version
# Should show: 9.x.x or higher
```

### Step 3.3: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Check if it's running
sudo systemctl status postgresql
# Press 'q' to exit

# Should show "active (running)" in green
```

### Step 3.4: Install Nginx

```bash
# Install Nginx web server
sudo apt install -y nginx

# Check if it's running
sudo systemctl status nginx
# Press 'q' to exit

# Should show "active (running)" in green
```

### Step 3.5: Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
# Should show version number
```

### Step 3.6: Install Git

```bash
# Install Git
sudo apt install -y git

# Verify installation
git --version
```

---

## PART 4: SETUP DATABASE

### Step 4.1: Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql
```

**You should now see:** `postgres=#`

**Run these commands in PostgreSQL:**

```sql
CREATE DATABASE crm_db;

CREATE USER crm_user WITH ENCRYPTED PASSWORD 'YourStrongPassword123!';

GRANT ALL PRIVILEGES ON DATABASE crm_db TO crm_user;

\q
```

**You should be back to:** `root@vps-xxxxx:~#`

### Step 4.2: Configure PostgreSQL Authentication

```bash
# Find PostgreSQL version
ls /etc/postgresql/
# Note the version number (e.g., 14, 15, 16)

# Edit configuration (replace 14 with your version)
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

**In the nano editor:**

1. Find this line (near the bottom):
```
local   all             all                                     peer
```

2. Change `peer` to `md5`:
```
local   all             all                                     md5
```

3. Press `Ctrl + X`, then `Y`, then `Enter` to save

```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# Verify it's running
sudo systemctl status postgresql
# Press 'q' to exit
```

---

## PART 5: UPLOAD YOUR APPLICATION

### Step 5.1: Create Application Directory

```bash
# Create directory
sudo mkdir -p /var/www/crm

# Set ownership
sudo chown -R $USER:$USER /var/www/crm

# Navigate to directory
cd /var/www/crm
```

### Step 5.2: Upload Files from Windows

**Open a NEW PowerShell window (keep SSH connected):**

```powershell
# Navigate to your project
cd d:\POPEYE\rma

# Upload server folder
scp -r server root@YOUR_VPS_IP:/var/www/crm/

# Upload client build
scp -r client/dist root@YOUR_VPS_IP:/var/www/crm/client/

# Upload package.json files
scp server/package.json root@YOUR_VPS_IP:/var/www/crm/server/
scp server/package-lock.json root@YOUR_VPS_IP:/var/www/crm/server/
```

**Enter your VPS password when prompted for each command**

---

## PART 6: CONFIGURE SERVER

### Step 6.1: Install Server Dependencies

**Back in your SSH terminal:**

```bash
# Navigate to server folder
cd /var/www/crm/server

# Install dependencies (this may take 2-3 minutes)
npm install --production

# List files to verify
ls -la
# You should see node_modules folder and .env file
```

### Step 6.2: Test Server Manually

```bash
# Try running the server
node server.js
```

**You should see:**
```
🚀 Server running on port 5000
✅ PostgreSQL connected successfully
✅ Database synchronized
```

**Press `Ctrl + C` to stop the server**

---

## PART 7: SETUP PM2 (KEEP SERVER RUNNING)

### Step 7.1: Start Server with PM2

```bash
# Make sure you're in server directory
cd /var/www/crm/server

# Start server with PM2
pm2 start server.js --name crm-backend

# Check status
pm2 status
# Should show crm-backend as "online"

# View logs
pm2 logs crm-backend --lines 20
# Press Ctrl + C to exit logs
```

### Step 7.2: Configure PM2 Auto-Start

```bash
# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Copy and run the command it shows (will look like):
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

---

## PART 8: CONFIGURE NGINX

### Step 8.1: Create Nginx Configuration

```bash
# Create new site configuration
sudo nano /etc/nginx/sites-available/crm
```

**Paste this configuration (replace YOUR_VPS_IP with your actual IP):**

```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP;

    # Frontend (React build)
    location / {
        root /var/www/crm/client/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
```

**Press `Ctrl + X`, then `Y`, then `Enter` to save**

### Step 8.2: Enable Site and Restart Nginx

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t
# Should show "syntax is ok" and "test is successful"

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
# Press 'q' to exit
# Should show "active (running)"
```

---

## PART 9: CONFIGURE FIREWALL

### Step 9.1: Setup UFW Firewall

```bash
# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable
# Type 'y' and press Enter

# Check status
sudo ufw status
# Should show ports 22, 80, 443 as ALLOW
```

---

## PART 10: VERIFY DEPLOYMENT

### Step 10.1: Check All Services

```bash
# Check PM2
pm2 status
# Should show crm-backend as "online"

# Check Nginx
sudo systemctl status nginx
# Should show "active (running)"

# Check PostgreSQL
sudo systemctl status postgresql
# Should show "active (running)"

# Test API endpoint
curl http://localhost:5000/api/auth/health
# Should return JSON response
```

### Step 10.2: Access Your Application

**Open your web browser and go to:**

```
http://YOUR_VPS_IP
```

**You should see your CRM login page!**

---

## PART 11: CREATE ADMIN USER (FIRST TIME ONLY)

### Step 11.1: Access Database

```bash
# Connect to database
sudo -u postgres psql -d crm_db
```

### Step 11.2: Create Admin User Manually

```sql
-- Check if users table exists
\dt

-- Insert admin user (change password hash as needed)
-- First, you need to register via the UI, or insert manually:
-- Note: You'll need to hash the password first using bcrypt

-- Exit database
\q
```

**OR register through the UI at:** `http://YOUR_VPS_IP/register`

---

## 🎉 DEPLOYMENT COMPLETE!

Your CRM is now live at: **http://YOUR_VPS_IP**

---

## USEFUL COMMANDS FOR LATER

### View Server Logs
```bash
pm2 logs crm-backend
pm2 logs crm-backend --lines 100
```

### Restart Server
```bash
pm2 restart crm-backend
```

### Stop Server
```bash
pm2 stop crm-backend
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Restart Nginx
```bash
sudo systemctl restart nginx
```

### Check Disk Space
```bash
df -h
```

### Check Memory Usage
```bash
free -h
```

### Monitor Server Resources
```bash
pm2 monit
```

---

## UPDATING YOUR APPLICATION

### When You Make Changes:

**1. On your local machine:**
```powershell
cd d:\POPEYE\rma\client
npm run build
```

**2. Upload new build:**
```powershell
scp -r dist/* root@YOUR_VPS_IP:/var/www/crm/client/dist/
```

**3. For server changes:**
```powershell
scp -r server/* root@YOUR_VPS_IP:/var/www/crm/server/
```

**4. On VPS, restart server:**
```bash
cd /var/www/crm/server
npm install --production
pm2 restart crm-backend
```

---

## TROUBLESHOOTING

### Problem: Can't connect to VPS
**Solution:**
```bash
# Check if SSH port is open
telnet YOUR_VPS_IP 22
```

### Problem: Website not loading
**Solution:**
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Problem: API not working
**Solution:**
```bash
# Check PM2 status
pm2 status

# Check server logs
pm2 logs crm-backend

# Restart server
pm2 restart crm-backend
```

### Problem: Database connection error
**Solution:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
sudo -u postgres psql -d crm_db -U crm_user -h localhost

# Check .env file
cd /var/www/crm/server
cat .env
```

### Problem: Port already in use
**Solution:**
```bash
# Check what's using port 5000
sudo lsof -i :5000

# Kill the process (replace PID with actual number)
sudo kill -9 PID
```

---

## BACKUP YOUR DATABASE

### Create Backup
```bash
# Create backup directory
sudo mkdir -p /var/backups/crm

# Backup database
sudo -u postgres pg_dump crm_db > /var/backups/crm/backup_$(date +%Y%m%d).sql

# List backups
ls -lh /var/backups/crm/
```

### Restore Backup
```bash
# Restore from backup
sudo -u postgres psql crm_db < /var/backups/crm/backup_20251104.sql
```

### Automated Daily Backups
```bash
# Edit crontab
sudo crontab -e

# Add this line (runs daily at 2 AM):
0 2 * * * sudo -u postgres pg_dump crm_db > /var/backups/crm/backup_$(date +\%Y\%m\%d).sql
```

---

## SECURITY CHECKLIST

- [ ] Changed default database password
- [ ] Set strong JWT_SECRET in .env
- [ ] Enabled UFW firewall
- [ ] Only necessary ports are open (22, 80, 443)
- [ ] Regular backups configured
- [ ] PM2 auto-restart enabled
- [ ] Nginx properly configured
- [ ] .env file not accessible via web

---

## NEXT STEPS (OPTIONAL)

### 1. Add Domain Name
- Point your domain to VPS IP in DNS settings
- Update Nginx config with domain name
- Get free SSL certificate with Let's Encrypt

### 2. Setup SSL Certificate
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 3. Setup Monitoring
- Configure PM2 monitoring
- Setup email alerts for server issues

---

## SUPPORT CONTACTS

**If you get stuck:**
1. Check the troubleshooting section above
2. Review PM2 logs: `pm2 logs crm-backend`
3. Review Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Check system resources: `pm2 monit`

---

## DEPLOYMENT CHECKLIST

- [ ] Updated API URL in client code
- [ ] Built client application
- [ ] Updated .env file with production values
- [ ] Connected to VPS via SSH
- [ ] Installed Node.js, PostgreSQL, Nginx, PM2
- [ ] Created database and user
- [ ] Uploaded application files
- [ ] Installed server dependencies
- [ ] Started server with PM2
- [ ] Configured Nginx
- [ ] Enabled firewall
- [ ] Tested application in browser
- [ ] Created admin user
- [ ] Configured backups

---

**🎊 Congratulations! Your CRM is now deployed and running on Hostinger VPS!**
