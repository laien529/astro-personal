# Deployment Guide

This guide assumes a Linux cloud server with Nginx installed. The default path uses static deployment because this project builds to plain files and does not need a Node process in production.

## 1. Local preparation

Install dependencies and verify the project locally:

```bash
npm install
npm run dev
```

Build the production files:

```bash
npm run build
```

The final static output is generated in `dist/`.

## 2. Server prerequisites

On your cloud server, prepare:

- Ubuntu or Debian-like Linux
- Nginx
- A domain name pointing to the server IP
- SSH access

Recommended packages:

```bash
sudo apt update
sudo apt install -y nginx rsync unzip
```

## 3. Create deployment directories

Use a release-based layout so rollbacks are easy.

```bash
sudo mkdir -p /var/www/astro-portfolio/releases
sudo mkdir -p /var/www/astro-portfolio/shared
sudo ln -sfn /var/www/astro-portfolio/releases /var/www/astro-portfolio/current || true
```

A cleaner version is:

```bash
sudo mkdir -p /var/www/astro-portfolio/releases
sudo mkdir -p /var/www/astro-portfolio/shared
```

## 4. Upload the build output

From your local machine:

```bash
RELEASE=$(date +%Y%m%d%H%M%S)
ssh user@your-server "mkdir -p /var/www/astro-portfolio/releases/$RELEASE"
rsync -avz --delete dist/ user@your-server:/var/www/astro-portfolio/releases/$RELEASE/
ssh user@your-server "ln -sfn /var/www/astro-portfolio/releases/$RELEASE /var/www/astro-portfolio/current"
```

After this, the active site path is:

```text
/var/www/astro-portfolio/current
```

## 5. Nginx configuration

Create a site config such as `/etc/nginx/sites-available/astro-portfolio`.

Sample config:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;

    root /var/www/astro-portfolio/current;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(css|js|png|jpg|jpeg|gif|svg|webp|ico)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/astro-portfolio /etc/nginx/sites-enabled/astro-portfolio
sudo nginx -t
sudo systemctl reload nginx
```

## 6. HTTPS with Let's Encrypt

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Request and apply a certificate:

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

## 7. Updating the site

Each update follows the same process:

```bash
npm run build
RELEASE=$(date +%Y%m%d%H%M%S)
ssh user@your-server "mkdir -p /var/www/astro-portfolio/releases/$RELEASE"
rsync -avz --delete dist/ user@your-server:/var/www/astro-portfolio/releases/$RELEASE/
ssh user@your-server "ln -sfn /var/www/astro-portfolio/releases/$RELEASE /var/www/astro-portfolio/current && sudo systemctl reload nginx"
```

## 8. Rollback

To roll back, point `current` back to an older release:

```bash
ssh user@your-server "ln -sfn /var/www/astro-portfolio/releases/OLDER_RELEASE /var/www/astro-portfolio/current && sudo systemctl reload nginx"
```

## 9. Optional Docker deployment

If you prefer shipping a container, use the included `deploy/Dockerfile`.

Build locally:

```bash
docker build -t astro-portfolio:latest -f deploy/Dockerfile .
```

Run on the server:

```bash
docker run -d --name astro-portfolio -p 8080:80 astro-portfolio:latest
```

Then put Nginx in front of `127.0.0.1:8080`.

## 10. Editing `siteUrl`

Before production, update `site` in `astro.config.mjs` and `siteUrl` in `src/data/site.ts` so canonical and social URLs are correct.

## 11. Recommended first customizations

- replace site title, name, and email
- replace project markdown entries
- replace social links
- swap colors in `src/styles/global.css`
- update favicon and preview image
