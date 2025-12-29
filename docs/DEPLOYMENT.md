# Riyan Website - Production Deployment Guide

Complete deployment guide for the Riyan website to the Raspberry Pi dev server.

**Infrastructure:** Raspberry Pi 5 (ARM64) running Debian 13, accessed via Tailscale VPN

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Architecture Overview](#architecture-overview)
3. [Initial Setup (One-Time)](#initial-setup-one-time)
4. [Normal Deployment Workflow](#normal-deployment-workflow)
5. [Database Management](#database-management)
6. [Media Management](#media-management)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## Quick Reference

| Action | Command |
|--------|---------|
| Deploy code | `git push origin develop` |
| View logs | `docker compose -f docker-compose.pi.yml logs -f` |
| Restart services | `docker compose -f docker-compose.pi.yml --env-file .env.pi restart` |
| Import database | `./scripts/db-import-pi.sh /tmp/backup.sql` |
| Export database | `./scripts/db-export-pi.sh` |
| Check status | `docker compose -f docker-compose.pi.yml ps` |

**Access URLs:**
- Website: `http://<tailscale-ip>:3000`
- Directus CMS: `http://<tailscale-ip>:8055`

---

## Architecture Overview

### Infrastructure Design

The Pi follows a **production-grade infrastructure model** with strict separation of concerns:

```
/data
├── projects/riyan          # Code only (docker-compose, .env, docs)
├── docker-volumes/         # ALL persistent container data
│   ├── riyan-mariadb/     # Database files
│   ├── riyan-directus-uploads/
│   └── riyan-wp-content/  # Media files (1.4GB+)
└── backups/riyan/         # Database backups (last 7 kept)
```

**Key Principles:**
- `/data/projects/` - Code and configuration ONLY, no persistent data
- `/data/docker-volumes/` - ALL container persistence
- Service accounts (`svc-docker`) own container data
- Admin user (`admin`) owns project code

### Technology Stack

- **Frontend:** Next.js 14 (App Router)
- **CMS:** Directus 11.2
- **Database:** MariaDB 10.4
- **Container Runtime:** Docker + Docker Compose
- **CI/CD:** GitHub Actions with self-hosted ARM64 runner
- **Registry:** GitHub Container Registry (GHCR)
- **Network:** Tailscale VPN mesh

---

## Initial Setup (One-Time)

This section is for **first-time deployment only**. Skip to [Normal Deployment](#normal-deployment-workflow) if already set up.

### Prerequisites

- Pi already configured per infrastructure playbook (`Initial Setup Version.md`)
- Tailscale installed and connected
- GitHub self-hosted runner configured with `dev` label
- Docker and Docker Compose installed

### Step 1: Clone Repository

```bash
# SSH to Pi via Tailscale
ssh admin@<tailscale-ip>

# Navigate to projects directory
cd /data/projects

# Clone repository
git clone https://github.com/sayya2/riyanV3.git riyan
cd riyan
git checkout develop
```

### Step 2: Set Permissions

```bash
# Ensure project follows /data policy
sudo chown -R admin:dev /data/projects/riyan
sudo chmod -R 2775 /data/projects/riyan

# Create docker-volumes directories
sudo mkdir -p /data/docker-volumes/riyan-mariadb
sudo mkdir -p /data/docker-volumes/riyan-directus-uploads
sudo mkdir -p /data/docker-volumes/riyan-wp-content

# Set ownership per policy
sudo chown -R svc-docker:docker /data/docker-volumes/riyan-mariadb
sudo chown -R svc-docker:docker /data/docker-volumes/riyan-directus-uploads
sudo chown -R svc-docker:docker /data/docker-volumes/riyan-wp-content

# Create backup directory
sudo mkdir -p /data/backups/riyan
sudo chown -R admin:ops /data/backups/riyan
sudo chmod 2770 /data/backups/riyan
```

### Step 3: Configure Environment

```bash
cd /data/projects/riyan

# Copy template
cp .env.pi.template .env.pi

# Get Tailscale IP
tailscale ip -4

# Edit environment file
nano .env.pi
```

**Required Configuration:**

```bash
# Database Credentials (GENERATE STRONG PASSWORDS!)
MYSQL_ROOT_PASSWORD=<20+ character password>
MYSQL_USER=user
MYSQL_PASSWORD=<20+ character password>
MYSQL_DATABASE=riyan_nextjs

# Directus Security Keys (GENERATE RANDOM 32+ CHAR STRINGS!)
DIRECTUS_KEY=<random 32+ character string>
DIRECTUS_SECRET=<random 32+ character string>
DIRECTUS_ADMIN_EMAIL=admin@riyan.com.mv
DIRECTUS_ADMIN_PASSWORD=<strong password>

# Public URLs (use your Tailscale IP)
DIRECTUS_PUBLIC_URL=http://<tailscale-ip>:8055
NEXT_PUBLIC_SITE_URL=http://<tailscale-ip>:3000
NEXT_PUBLIC_DIRECTUS_URL=http://<tailscale-ip>:8055

# Security
REVALIDATE_SECRET=<random string>
DIRECTUS_TOKEN=<optional static token>

# Docker settings
DATA_ROOT=/data
```

**Save and exit:** Ctrl+X, Y, Enter

**⚠️ SECURITY:** Never commit `.env.pi` to git!

### Step 4: Initial Database Import

**From development machine:**

```powershell
# Export database
cd "D:\VIPERTIK\Riayn PVT LTD\RiyanSite\riyan"
New-Item -ItemType Directory -Force -Path "backups" | Out-Null
docker compose exec -T mariadb mysqldump -u user -p'Riyanitaccess@26+' riyan_nextjs | Out-File -Encoding utf8 "backups\riyan_latest.sql"

# Transfer to Pi
scp "backups\riyan_latest.sql" admin@<tailscale-ip>:/tmp/
```

**On Pi:**

```bash
cd /data/projects/riyan

# Start MariaDB only
docker compose -f docker-compose.pi.yml --env-file .env.pi up -d mariadb

# Wait 30 seconds
sleep 30

# Import database
./scripts/db-import-pi.sh /tmp/riyan_latest.sql
# Type "yes" to confirm

# Clean up
rm /tmp/riyan_latest.sql
```

### Step 5: Media Files Sync (One-Time)

**From development machine:**

```powershell
# Sync 1.4GB of media files (takes 10-15 minutes)
rsync -avz --progress `
  "D:\VIPERTIK\Riayn PVT LTD\RiyanSite\riyan\wp-content\uploads/" `
  admin@<tailscale-ip>:/data/docker-volumes/riyan-wp-content/uploads/
```

**On Pi - fix ownership:**

```bash
sudo chown -R svc-docker:docker /data/docker-volumes/riyan-wp-content
```

**📝 Note:** This is a ONE-TIME operation. After this, all uploads happen directly on the Pi via Directus.

### Step 6: Pull Docker Image

```bash
cd /data/projects/riyan

# Pull latest image from GHCR
docker pull ghcr.io/sayya2/riyanwebsite:develop
```

### Step 7: Start All Services

```bash
# Start everything
docker compose -f docker-compose.pi.yml --env-file .env.pi up -d

# Verify all services running
docker compose -f docker-compose.pi.yml ps

# Expected output:
# NAME               STATUS
# riyan_mariadb      running
# riyan_directus     running
# riyan_web          running

# Check logs
docker compose -f docker-compose.pi.yml logs -f
```

Press Ctrl+C to stop watching logs.

### Step 8: Verify Deployment

Test from any device on Tailscale network:

- **Website:** `http://<tailscale-ip>:3000`
- **Directus:** `http://<tailscale-ip>:8055`

Login to Directus with credentials from `.env.pi`

---

## Normal Deployment Workflow

Once initial setup is complete, deployments are **fully automated**.

### Deploying Code Changes

```bash
# On development machine
cd "D:\VIPERTIK\Riayn PVT LTD\RiyanSite\riyan"

# Make your changes...

# Commit and push
git add .
git commit -m "Description of changes"
git push origin develop
```

**What Happens Automatically:**

1. ✅ GitHub Actions workflow triggers
2. ✅ Builds ARM64 Docker image on Pi (15-20 min)
3. ✅ Pushes image to GHCR
4. ✅ Pi runner pulls latest code
5. ✅ Pi runner pulls updated image
6. ✅ Pi runner restarts services

**Total Time:** ~20-25 minutes (most time is ARM64 build)

### Monitoring Deployment

**GitHub Actions:**
```
https://github.com/sayya2/riyanV3/actions
```

**On the Pi:**
```bash
ssh admin@<tailscale-ip>

# Watch deployment happen
cd /data/projects/riyan
docker compose -f docker-compose.pi.yml logs -f
```

**Check GitHub Runner Status:**
```bash
# On Pi
sudo systemctl status actions.runner.*
```

---

## Database Management

### Exporting Database from Dev Environment

**From development machine:**

```powershell
cd "D:\VIPERTIK\Riayn PVT LTD\RiyanSite\riyan"

# Export database
docker compose exec -T mariadb mysqldump -u user -p'Riyanitaccess@26+' riyan_nextjs | Out-File -Encoding utf8 "backups\riyan_export_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
```

### Exporting Database from Pi

```bash
# SSH to Pi
ssh admin@<tailscale-ip>
cd /data/projects/riyan

# Export with automatic retention (keeps last 7)
./scripts/db-export-pi.sh
```

**Output location:** `/data/backups/riyan/riyan_db_YYYYMMDD_HHMMSS.sql`

**Features:**
- Includes routines and triggers
- Single transaction (no locking)
- Automatic old backup cleanup

### Importing Database to Pi

**Step 1: Transfer SQL file**

```powershell
# From dev machine
scp "backups\riyan_latest.sql" admin@<tailscale-ip>:/tmp/
```

**Step 2: Import on Pi**

```bash
# SSH to Pi
ssh admin@<tailscale-ip>
cd /data/projects/riyan

# Import (will prompt for confirmation)
./scripts/db-import-pi.sh /tmp/riyan_latest.sql

# Type "yes" to confirm

# Clean up
rm /tmp/riyan_latest.sql
```

**What the import script does:**
1. Validates SQL file exists
2. Reads credentials from `.env.pi`
3. Shows file size and prompts for confirmation
4. Imports database
5. Automatically restarts Directus to apply changes

### Database Backup Best Practices

**Before major changes:**
```bash
# On Pi - create backup before risky operation
./scripts/db-export-pi.sh
```

**Regular backups:**
Consider setting up a cron job:
```bash
# On Pi
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /data/projects/riyan && ./scripts/db-export-pi.sh
```

---

## Media Management

### Understanding Media Storage

- **Development:** `./wp-content/uploads/` (gitignored, 1.4GB+)
- **Production (Pi):** `/data/docker-volumes/riyan-wp-content/uploads/`

Media files are **NOT synced automatically**.

### Initial Sync (Already Done in Setup)

The one-time rsync during initial setup synced all media.

### Ongoing Operations

**After initial setup:**
- ✅ All new uploads happen directly on Pi via Directus
- ✅ No manual syncing required
- ✅ Media persisted in `/data/docker-volumes/riyan-wp-content/`

### Re-syncing Media (If Needed)

**If development has updated media:**

```powershell
# From dev machine
rsync -avz --progress `
  --delete `
  "D:\VIPERTIK\Riayn PVT LTD\RiyanSite\riyan\wp-content\uploads/" `
  admin@<tailscale-ip>:/data/docker-volumes/riyan-wp-content/uploads/
```

**On Pi - fix ownership:**
```bash
sudo chown -R svc-docker:docker /data/docker-volumes/riyan-wp-content
```

**⚠️ Warning:** `--delete` flag removes files on Pi not in dev. Omit if unsure.

### Checking Media

```bash
# On Pi
ls -lh /data/docker-volumes/riyan-wp-content/uploads/ | head -20
du -sh /data/docker-volumes/riyan-wp-content/uploads/
```

---

## Troubleshooting

### GitHub Actions Build Hanging

**Symptom:** Build stuck at `npm ci` step for 20+ minutes

**Cause:** ARM64 build on Pi is slow (15-20 min normal)

**Solutions:**

1. **Wait it out** - First build takes 20-30 minutes
2. **Check Pi CPU:**
   ```bash
   ssh admin@<tailscale-ip>
   htop
   # CPU should be at ~100% if building
   ```

3. **Manual pull if build succeeded:**
   ```bash
   # On Pi
   cd /data/projects/riyan
   docker pull ghcr.io/sayya2/riyanwebsite:develop
   docker compose -f docker-compose.pi.yml --env-file .env.pi up -d
   ```

### Git Conflict on Pi During Deployment

**Symptom:**
```
error: Your local changes to the following files would be overwritten by merge
```

**Cause:** Local files modified on Pi

**Solution 1 - Discard local changes (recommended):**
```bash
# On Pi
cd /data/projects/riyan
git reset --hard origin/develop
git pull origin develop
```

**Solution 2 - Stash changes:**
```bash
# On Pi
cd /data/projects/riyan
git stash
git pull origin develop
# Later: git stash pop
```

**Prevention:** The workflow now uses `git reset --hard origin/develop` to auto-fix this.

### Directus Login Issues After DB Import

**Symptom:** Cannot login to Directus with known password

**Cause:** Imported database has different admin credentials than `.env.pi`

**Solution 1 - Use credentials from imported database:**

Try the password that was used in the development environment.

**Solution 2 - Reset password via database:**

```bash
# On Pi
docker exec -it riyan_mariadb mysql -u root -p

USE riyan_nextjs;
SELECT email FROM directus_users WHERE email LIKE '%admin%';

# Generate new hash at: https://argon2.online/
# Or get hash from another working Directus instance

UPDATE directus_users
SET password = '$argon2id$v=19$m=65536,t=3,p=4$...'
WHERE email = 'admin@riyan.com.mv';

exit;
```

**Solution 3 - Let Directus recreate admin:**

```bash
# On Pi
cd /data/projects/riyan

# Stop services
docker compose -f docker-compose.pi.yml down

# Edit .env.pi, ensure DIRECTUS_ADMIN_PASSWORD is set
nano .env.pi

# Restart - Directus will recreate admin if not exists
docker compose -f docker-compose.pi.yml --env-file .env.pi up -d
```

### Missing Media Files / 404 Errors

**Symptom:** Images not loading, 404 errors for media

**Check if media exists:**
```bash
# On Pi
ls -lh /data/docker-volumes/riyan-wp-content/uploads/ | head -20
```

**If empty or incomplete:**
```powershell
# From dev machine - re-sync media
rsync -avz --progress `
  "D:\VIPERTIK\Riayn PVT LTD\RiyanSite\riyan\wp-content\uploads/" `
  admin@<tailscale-ip>:/data/docker-volumes/riyan-wp-content/uploads/
```

**Then fix ownership:**
```bash
# On Pi
sudo chown -R svc-docker:docker /data/docker-volumes/riyan-wp-content
```

### Service Won't Start

**Check logs:**
```bash
# On Pi
docker compose -f docker-compose.pi.yml logs -f
```

**Check disk space:**
```bash
df -h /data
```

**If disk full:**
```bash
# Clean old backups
rm /data/backups/riyan/riyan_db_*.sql

# Clean Docker
docker system prune -a

# WARNING: Above removes ALL unused Docker data
```

**Check container status:**
```bash
docker compose -f docker-compose.pi.yml ps
```

**Restart specific service:**
```bash
# Restart just one service
docker compose -f docker-compose.pi.yml restart directus

# Or restart all
docker compose -f docker-compose.pi.yml restart
```

**Nuclear option - full restart:**
```bash
docker compose -f docker-compose.pi.yml down
docker compose -f docker-compose.pi.yml up -d
```

### Database Import Hangs

**Symptom:** Import script runs but never completes

**Check progress:**
```bash
# In another terminal on Pi
docker exec -it riyan_mariadb mysql -u root -p

SHOW PROCESSLIST;

# Check table counts
USE riyan_nextjs;
SELECT COUNT(*) FROM news;
SELECT COUNT(*) FROM projects;
```

**For large imports, use progress indicator:**
```bash
# On Pi
pv /tmp/backup.sql | docker exec -i riyan_mariadb mysql -u root -p$(grep MYSQL_ROOT_PASSWORD .env.pi | cut -d '=' -f2 | tr -d '"' | tr -d "'") riyan_nextjs
```

### GitHub Runner Not Working

**Check runner status:**
```bash
# On Pi
sudo systemctl status actions.runner.*
```

**If stopped:**
```bash
sudo systemctl start actions.runner.*
```

**Check runner logs:**
```bash
# On Pi
cd /actions-runner
./run.sh
```

**Common issues:**
- ✅ Verify runner has `dev` label in GitHub settings
- ✅ Check `GITHUB_TOKEN` secret exists in repo
- ✅ Ensure `/data/projects/riyan` exists
- ✅ Check disk space: `df -h /data`

### Port Already in Use

**Symptom:**
```
Error: bind: address already in use
```

**Find what's using the port:**
```bash
# On Pi
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :8055
```

**Kill conflicting service:**
```bash
# Find container using port
docker ps

# Stop it
docker stop <container-name>
```

---

## Maintenance

### Health Checks

**Quick health check:**
```bash
# On Pi
cd /data/projects/riyan

# All services running?
docker compose -f docker-compose.pi.yml ps

# Check logs for errors
docker compose -f docker-compose.pi.yml logs --tail=100
```

**Detailed health check:**
```bash
# Database
docker exec riyan_mariadb mysql -u root -p -e "SELECT VERSION();"

# Directus
curl -I http://localhost:8055/server/health

# Next.js
curl -I http://localhost:3000

# Disk usage
df -h /data

# Container resources
docker stats --no-stream
```

### Regular Maintenance Tasks

**Weekly:**
- Check disk space: `df -h /data`
- Review logs for errors
- Verify backups exist: `ls -lh /data/backups/riyan/`

**Monthly:**
- Clean old Docker images: `docker image prune -a`
- Review backup retention
- Check for OS updates: `sudo apt update && sudo apt upgrade`

### Rollback Procedures

**Rollback code deployment:**
```bash
# On Pi
cd /data/projects/riyan

# Find previous commit
git log --oneline -10

# Reset to previous commit
git reset --hard <previous-commit-sha>

# Pull specific image version
docker pull ghcr.io/sayya2/riyanwebsite:<commit-sha>

# Update docker-compose to use specific tag, then:
docker compose -f docker-compose.pi.yml --env-file .env.pi up -d
```

**Rollback database:**
```bash
# On Pi
ls -lh /data/backups/riyan/

# Import previous backup
./scripts/db-import-pi.sh /data/backups/riyan/riyan_db_YYYYMMDD_HHMMSS.sql
```

**Complete reset (⚠️ DESTRUCTIVE):**
```bash
# On Pi
cd /data/projects/riyan

# Stop and remove everything
docker compose -f docker-compose.pi.yml down -v

# Remove all data
sudo rm -rf /data/docker-volumes/riyan-*

# Then re-run initial setup steps
```

### Updating Dependencies

**Update Next.js dependencies:**
```bash
# On dev machine
cd "D:\VIPERTIK\Riayn PVT LTD\RiyanSite\riyan"

npm update
npm audit fix

# Test locally
npm run build
npm run dev

# Commit and push
git add package.json package-lock.json
git commit -m "Update dependencies"
git push origin develop

# Automatic deployment will build with new deps
```

**Update Directus:**
```bash
# On Pi
nano docker-compose.pi.yml

# Change version:
# directus/directus:11.2 → directus/directus:11.3

# Pull new image and restart
docker compose -f docker-compose.pi.yml pull directus
docker compose -f docker-compose.pi.yml up -d directus
```

---

## Useful Commands

### Docker Operations

```bash
# View logs (all services)
docker compose -f docker-compose.pi.yml logs -f

# View logs (specific service)
docker compose -f docker-compose.pi.yml logs -f web

# Restart all services
docker compose -f docker-compose.pi.yml restart

# Restart specific service
docker compose -f docker-compose.pi.yml restart directus

# Rebuild and restart (after docker-compose changes)
docker compose -f docker-compose.pi.yml up -d --build

# Stop all services
docker compose -f docker-compose.pi.yml down

# Stop and remove volumes (⚠️ DELETES DATA)
docker compose -f docker-compose.pi.yml down -v

# Check resource usage
docker stats

# Clean unused resources
docker system prune
docker image prune -a
```

### Database Operations

```bash
# Connect to MariaDB
docker exec -it riyan_mariadb mysql -u root -p

# Export database
./scripts/db-export-pi.sh

# Import database
./scripts/db-import-pi.sh /tmp/backup.sql

# Check database size
docker exec riyan_mariadb mysql -u root -p -e "
SELECT
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'riyan_nextjs'
GROUP BY table_schema;"
```

### System Operations

```bash
# Check disk space
df -h /data

# Check system resources
htop

# Check network connectivity
ping google.com

# Check Tailscale status
tailscale status
tailscale ip -4

# Check open ports
sudo netstat -tulpn | grep LISTEN

# View systemd service status
sudo systemctl status docker
sudo systemctl status actions.runner.*
```

### Git Operations

```bash
# On Pi
cd /data/projects/riyan

# Check status
git status

# Pull latest
git pull origin develop

# Force reset to remote
git fetch origin develop
git reset --hard origin/develop

# View commit history
git log --oneline -10

# Show specific commit
git show <commit-sha>
```

---

## Security Considerations

### Credential Management

**Never commit to git:**
- `.env.pi` - Contains all production secrets
- `.env` - Contains dev credentials
- `*.pem` - SSH keys
- `*.sql` - Database dumps may contain sensitive data

**Verify .gitignore:**
```bash
# On dev machine
git check-ignore -v .env.pi
# Should show it's ignored
```

### Access Control

**Pi follows strict RBAC:**
- `admin` user - Full access to projects and operations
- `svc-docker` - Docker service account, owns container data
- `svc-samba` - Samba service account

**Verify permissions:**
```bash
# On Pi
ls -ld /data/projects/riyan
# Should be: admin:dev

ls -ld /data/docker-volumes/riyan-*
# Should be: svc-docker:docker
```

### Network Security

**Tailscale only:**
- All services accessible only via Tailscale VPN
- No public internet exposure
- Tailscale ACLs control access

**Verify:**
```bash
# On Pi
tailscale status
```

### Backup Security

**Backups contain sensitive data:**
```bash
# On Pi
ls -ld /data/backups/riyan
# Should be: admin:ops, permissions: 2770
```

Only `admin` and `ops` group can access backups.

---

## Related Documentation

- **Infrastructure Playbook:** `D:\notesApp\dev brain\Devices\Initial Setup Version.md`
- **Docker Compose (Pi):** `docker-compose.pi.yml`
- **Environment Template:** `.env.pi.template`
- **GitHub Workflow:** `.github/workflows/deploy-develop.yml`

---

## Support & Escalation

### Getting Help

1. **Check logs first:**
   ```bash
   docker compose -f docker-compose.pi.yml logs -f
   ```

2. **Review this guide:** Search for similar issues in Troubleshooting section

3. **Check GitHub Actions:** View workflow runs for deployment issues

4. **Verify infrastructure:** Ensure Pi follows `/data` policy

### Escalation Path

1. Check service logs and status
2. Verify environment configuration (`.env.pi`)
3. Test rollback procedures
4. Check GitHub Actions workflow logs
5. Contact team lead with:
   - Error messages from logs
   - Steps to reproduce
   - Recent changes made

---

## Changelog

**2025-12-28:**
- ✅ Initial deployment completed
- ✅ Automated GitHub Actions workflow configured
- ✅ Database import/export scripts created
- ✅ Media sync completed (1.4GB)
- ✅ All services verified working
- ✅ Documentation created

---

**Last Updated:** 2025-12-28
**Maintained By:** Development Team
**Status:** Production Ready ✅
