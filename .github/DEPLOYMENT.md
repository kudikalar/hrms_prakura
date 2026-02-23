# Prakura HRMS Deployment Guide

## GitHub Actions Setup

This project includes three GitHub Actions workflows for automated deployment:

### 1. `deploy.yml` - SSH-based Deployment
Deploys both frontend and backend to a server via SSH.

### 2. `docker-deploy.yml` - Docker-based Deployment
Builds Docker images and deploys using Docker Compose.

### 3. `test.yml` - Automated Testing
Runs tests on every push and pull request.

## Required GitHub Secrets

Configure these secrets in your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

### For SSH Deployment (`deploy.yml`):

```yaml
# Server Configuration
SERVER_HOST: your-server-ip.com
SERVER_USER: deploy
SSH_PRIVATE_KEY: |  # Your private SSH key
  -----BEGIN OPENSSH PRIVATE KEY-----
  ...
  -----END OPENSSH PRIVATE KEY-----

# Deployment Paths
DEPLOY_PATH: /var/www/prakura-hrms

# Application URLs
BACKEND_URL: https://api.prakura.com
FRONTEND_URL: https://app.prakura.com

# Database
DATABASE_URL: postgresql://user:password@localhost:5432/prakura_hrms

# Security
JWT_SECRET: your-super-secure-jwt-secret-key-here

# Email Notifications (Optional)
SMTP_SERVER: smtp.gmail.com
SMTP_PORT: 587
SMTP_USERNAME: your-email@gmail.com
SMTP_PASSWORD: your-app-password
NOTIFICATION_EMAIL: team@prakura.com
```

### For Docker Deployment (`docker-deploy.yml`):

```yaml
# Same as above, plus:
GITHUB_TOKEN: (automatically provided by GitHub Actions)
```

## Server Prerequisites

### For SSH Deployment:

1. **Install Node.js 20+**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Install PostgreSQL 15**
```bash
sudo apt-get install postgresql-15 postgresql-client-15
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb prakura_hrms
```

3. **Install Yarn**
```bash
npm install -g yarn
```

4. **Setup Deployment Directory**
```bash
sudo mkdir -p /var/www/prakura-hrms
sudo chown -R $USER:$USER /var/www/prakura-hrms
```

5. **Install Supervisor** (Process Manager)
```bash
sudo apt-get install supervisor

# Create backend service
sudo nano /etc/supervisor/conf.d/prakura-backend.conf
```

Add:
```ini
[program:prakura-backend]
command=node /var/www/prakura-hrms/backend/src/index.js
directory=/var/www/prakura-hrms/backend
autostart=true
autorestart=true
user=deploy
environment=NODE_ENV="production"
stdout_logfile=/var/log/prakura-backend.log
stderr_logfile=/var/log/prakura-backend-error.log
```

6. **Install Nginx** (Reverse Proxy)
```bash
sudo apt-get install nginx

# Create site configuration
sudo nano /etc/nginx/sites-available/prakura
```

Add:
```nginx
server {
    listen 80;
    server_name app.prakura.com;

    location / {
        root /var/www/prakura-hrms/frontend/build;
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 80;
    server_name api.prakura.com;

    location / {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/prakura /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### For Docker Deployment:

1. **Install Docker**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

2. **Install Docker Compose**
```bash
sudo apt-get install docker-compose-plugin
```

## Deployment Process

### Automatic Deployment

1. **Push to main branch**:
```bash
git add .
git commit -m "Deploy: description"
git push origin main
```

GitHub Actions will automatically:
- Run tests
- Build frontend and backend
- Deploy to production server
- Run health checks
- Send email notification

### Manual Deployment

1. Go to **Actions** tab in GitHub
2. Select **Deploy Prakura HRMS** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

### Rollback

1. Go to **Actions** tab
2. Select **Deploy Prakura HRMS** workflow
3. Click **Run workflow**
4. The rollback job will revert to the previous version

## Health Checks

The deployment automatically checks:
- Backend: `https://api.prakura.com/api/health`
- Frontend: `https://app.prakura.com`

If either fails, the deployment is marked as failed.

## Monitoring

### Check Backend Logs
```bash
sudo tail -f /var/log/prakura-backend.log
sudo tail -f /var/log/prakura-backend-error.log
```

### Check Supervisor Status
```bash
sudo supervisorctl status prakura-backend
sudo supervisorctl status prakura-frontend
```

### Restart Services
```bash
sudo supervisorctl restart prakura-backend
sudo supervisorctl restart prakura-frontend
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t  # Test configuration
```

## Troubleshooting

### Deployment Failed

1. Check GitHub Actions logs
2. SSH into server and check logs
3. Verify all secrets are configured
4. Ensure server has enough disk space

### Database Migration Issues

```bash
cd /var/www/prakura-hrms/backend
npx prisma migrate status
npx prisma migrate resolve --applied <migration-name>
```

### Frontend Not Loading

1. Check if build folder exists:
```bash
ls -la /var/www/prakura-hrms/frontend/build
```

2. Check Nginx configuration:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Backend API Not Responding

1. Check if process is running:
```bash
sudo supervisorctl status prakura-backend
```

2. Check logs:
```bash
sudo tail -100 /var/log/prakura-backend-error.log
```

3. Restart service:
```bash
sudo supervisorctl restart prakura-backend
```

## Security Best Practices

1. **Always use HTTPS in production** (setup SSL with Let's Encrypt)
2. **Rotate JWT secrets regularly**
3. **Keep dependencies updated**
4. **Use environment variables for all secrets**
5. **Enable database backups**
6. **Set up monitoring and alerting**

## Continuous Integration

The `test.yml` workflow runs on every:
- Push to main/develop branches
- Pull request to main/develop branches

This ensures code quality before deployment.
