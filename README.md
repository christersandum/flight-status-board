# flight-status-board
Flight status board application with C backend and web frontend

## Deployment to a Server

This guide explains how to deploy the Flight Status Board to a production server so it can be accessed from anywhere on the internet.

### Server Options

You can deploy this application on any Linux server. Popular options include:

1. **Cloud VPS Providers** (Starting from $4-6/month):
   - [DigitalOcean Droplets](https://www.digitalocean.com/) - Simple and beginner-friendly
   - [AWS EC2](https://aws.amazon.com/ec2/) - Free tier available for 12 months
   - [Linode](https://www.linode.com/) - Good performance and pricing
   - [Vultr](https://www.vultr.com/) - Wide range of locations
   - [Hetzner Cloud](https://www.hetzner.com/cloud) - Budget-friendly European option
   - [Google Cloud Compute Engine](https://cloud.google.com/compute) - Free tier available

2. **Platform-as-a-Service** (Easier but more expensive):
   - [Heroku](https://www.heroku.com/) - Easy deployment with buildpacks
   - [Railway](https://railway.app/) - Modern deployment platform
   - [Render](https://render.com/) - Free tier available

3. **Home Server/Raspberry Pi**:
   - Great for learning and personal use
   - Requires port forwarding on your router

### Quick Start: Deploy to Ubuntu/Debian Server

#### 1. Get a Server

For this example, we'll use DigitalOcean (similar steps work for other providers):

1. Sign up at [DigitalOcean](https://www.digitalocean.com/)
2. Create a new Droplet (virtual server):
   - **OS**: Ubuntu 22.04 LTS or newer
   - **Size**: Basic plan ($4-6/month is sufficient)
   - **Region**: Choose closest to your users
   - **Authentication**: SSH keys recommended (more secure)
3. Note your server's IP address (e.g., `203.0.113.45`)

#### 2. Connect to Your Server

```bash
# Connect via SSH (replace with your server's IP)
ssh root@203.0.113.45
```

#### 3. Install Dependencies

```bash
# Update package list
sudo apt update

# Install required packages
sudo apt install -y gcc make libcurl4-openssl-dev git

# Optional: Install nginx for reverse proxy
sudo apt install -y nginx
```

#### 4. Clone and Build the Application

```bash
# Create a directory for the application
mkdir -p /opt/flight-status-board
cd /opt/flight-status-board

# Clone the repository
git clone https://github.com/christersandum/flight-status-board.git .

# Build the application
make
```

#### 5. Configure the Application (Optional)

If you want real flight data, add your API key:

```bash
# Edit config.txt and add your AviationStack API key
nano config.txt
# Add: API_KEY=your_api_key_here
```

#### 6. Test the Application

```bash
# Start the server
./flight-server

# In another terminal or browser, test it works:
# curl http://localhost:8080
# or visit http://YOUR_SERVER_IP:8080 in your browser
```

Press Ctrl+C to stop the server.

#### 7. Set Up as a System Service (Run Automatically)

Create a systemd service file to run the application automatically:

```bash
sudo nano /etc/systemd/system/flight-status-board.service
```

Add this content:

```ini
[Unit]
Description=Flight Status Board Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/flight-status-board
ExecStart=/opt/flight-status-board/flight-server
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
# Reload systemd configuration
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable flight-status-board

# Start the service now
sudo systemctl start flight-status-board

# Check status
sudo systemctl status flight-status-board
```

Useful commands:
```bash
# Stop the service
sudo systemctl stop flight-status-board

# Restart the service
sudo systemctl restart flight-status-board

# View logs
sudo journalctl -u flight-status-board -f
```

#### 8. Configure Firewall

```bash
# Allow HTTP traffic (port 80)
sudo ufw allow 80/tcp

# Allow HTTPS traffic (port 443) - recommended
sudo ufw allow 443/tcp

# Allow SSH (port 22) - IMPORTANT!
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

#### 9. Set Up Reverse Proxy with Nginx (Recommended)

Using Nginx as a reverse proxy provides better performance and allows you to:
- Use a domain name instead of IP:8080
- Easily add HTTPS/SSL
- Serve multiple applications on the same server

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/flight-status-board
```

Add this content:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain
    
    location / {
        proxy_pass http://localhost:8080;
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

Enable the configuration:

```bash
# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/flight-status-board /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

Now you can access your application at `http://your-domain.com` (without the :8080 port).

#### 10. Set Up HTTPS with Let's Encrypt (Recommended)

Secure your application with free SSL certificates:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)
```

Certbot will automatically:
- Obtain an SSL certificate
- Configure Nginx for HTTPS
- Set up automatic renewal

Test automatic renewal:
```bash
sudo certbot renew --dry-run
```

### Domain and DNS Setup

To use a domain name instead of an IP address:

1. **Purchase a domain** from:
   - [Namecheap](https://www.namecheap.com/)
   - [Google Domains](https://domains.google/)
   - [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/)

2. **Configure DNS records** in your domain registrar:
   - Add an **A record** pointing to your server's IP address:
     ```
     Type: A
     Name: @
     Value: 203.0.113.45  (your server IP)
     TTL: 3600
     ```
   - Add a **CNAME record** for www (optional):
     ```
     Type: CNAME
     Name: www
     Value: your-domain.com
     TTL: 3600
     ```

3. **Wait for DNS propagation** (5 minutes to 48 hours, usually ~1 hour)

4. **Test your domain**:
   ```bash
   ping your-domain.com
   ```

### Security Considerations

1. **Use HTTPS**: Always use SSL/TLS in production (Let's Encrypt is free)

2. **Firewall**: Only open necessary ports (22, 80, 443)

3. **Updates**: Keep your server updated:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. **SSH Security**:
   - Use SSH keys instead of passwords
   - Disable root login
   - Change default SSH port
   - Use fail2ban to prevent brute-force attacks

5. **API Keys**: Keep your API keys secure and don't commit them to version control

6. **Rate Limiting**: Consider adding rate limiting to prevent abuse

7. **Monitoring**: Set up monitoring and alerting (e.g., UptimeRobot, Prometheus)

### Monitoring and Maintenance

#### Check Application Status
```bash
# Check if service is running
sudo systemctl status flight-status-board

# View real-time logs
sudo journalctl -u flight-status-board -f

# Check last 100 lines of logs
sudo journalctl -u flight-status-board -n 100
```

#### Update the Application
```bash
# Navigate to application directory
cd /opt/flight-status-board

# Pull latest changes
git pull

# Rebuild
make clean && make

# Restart service
sudo systemctl restart flight-status-board
```

#### Monitor Server Resources
```bash
# Check CPU and memory usage
htop

# Check disk space
df -h

# Check network connections
netstat -tlnp
```

### Cost Estimates

**Minimal Setup** (Home/Learning):
- Free or $0-10/month if using free tiers

**Small Production Setup**:
- VPS: $4-6/month (DigitalOcean, Linode, Vultr)
- Domain: $10-15/year
- SSL: Free (Let's Encrypt)
- **Total: ~$5-7/month + domain**

**Medium Production Setup**:
- VPS: $12-24/month (better performance)
- Domain: $10-15/year
- CDN (optional): $0-5/month (Cloudflare free tier available)
- Backup storage: $1-5/month
- **Total: ~$15-30/month + domain**

### Alternative: Docker Deployment

For easier deployment and portability, you can use Docker (see the Dockerfile in the repository).

### Troubleshooting

**Cannot connect to server:**
- Check firewall rules: `sudo ufw status`
- Verify service is running: `sudo systemctl status flight-status-board`
- Check logs: `sudo journalctl -u flight-status-board -n 50`
- Test local connection: `curl http://localhost:8080`

**Port 8080 already in use:**
- Check what's using the port: `sudo lsof -i :8080`
- Kill the process or change the application port in `backend/server.c`

**Permission denied errors:**
- Ensure proper ownership: `sudo chown -R root:root /opt/flight-status-board`
- Check file permissions: `ls -la /opt/flight-status-board`

**Nginx errors:**
- Test configuration: `sudo nginx -t`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Verify Nginx is running: `sudo systemctl status nginx`

### Need Help?

- Check the [GitHub Issues](https://github.com/christersandum/flight-status-board/issues)
- Consult your VPS provider's documentation
- Community forums: [DigitalOcean Community](https://www.digitalocean.com/community), [Stack Overflow](https://stackoverflow.com/)
