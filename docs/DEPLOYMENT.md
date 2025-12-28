# Deployment Guide - Riyan Website (Dev Pi)

This guide covers deployment to the Raspberry Pi development server via Tailscale.

---

## Quick Reference

| Action | Command |
|--------|---------|
| Deploy code | `git push origin develop` (automatic via GitHub Actions) |
| Import database | `./scripts/db-import-pi.sh /tmp/backup.sql` |
| Export database | `./scripts/db-export-pi.sh` |
| View logs | `docker compose -f docker-compose.pi.yml logs -f` |
| Restart services | `docker compose -f docker-compose.pi.yml --env-file .env.pi restart` |

---

## Automated Code Deployment

### Normal Workflow

```bash
# On your development machine
git add .
git commit -m "Your changes"
git push origin develop
```

**What happens automatically:**
1. ✅ GitHub Actions triggers on push to `develop`
2. ✅ Builds ARM64 Docker image for Raspberry Pi
3. ✅ Pushes image to GitHub Container Registry (GHCR)
4. ✅ Self-hosted runner on Pi pulls latest code
5. ✅ Runner pulls updated Docker image
6. ✅ Runner restarts services with new code

**Expected deployment time:** 3-5 minutes

### Monitoring Deployment

**GitHub Actions:**
- Go to: https://github.com/[your-repo]/actions
- Check "Build and Deploy (develop)" workflow
- View real-time logs

**On the Pi:**
```bash
# SSH to Pi
ssh pi@<tailscale-ip>

# Watch deployment logs
cd /data/projects/riyan
docker compose -f docker-compose.pi.yml logs -f
```

---

## Database Management

### Exporting Database from Pi

```bash
# SSH to Pi
ssh pi@<tailscale-ip>
cd /data/projects/riyan

# Export database
./scripts/db-export-pi.sh
```

**Output location:** `/data/backups/riyan/riyan_db_YYYYMMDD_HHMMSS.sql`

**Retention:** Last 7 backups are kept automatically

### Importing Database to Pi

**Step 1: Transfer SQL file**
```bash
# From your development machine
scp db_init/riyan_nextjs_20251228-0502.sql pi@<tailscale-ip>:/tmp/
```

**Step 2: Import on Pi**
```bash
# SSH to Pi
ssh pi@<tailscale-ip>
cd /data/projects/riyan

# Import database (will prompt for confirmation)
./scripts/db-import-pi.sh /tmp/riyan_nextjs_20251228-0502.sql
```

**What the script does:**
1. Validates SQL file exists
2. Reads credentials from `.env.pi`
3. Prompts for confirmation (safety check)
4. Imports database
5. Restarts Directus to apply changes

---

## Media File Management

### Initial Setup (One-Time)

Media files are **NOT** stored in Git. Initial sync required:

```bash
# On your development machine
cd "D:\VIPERTIK\Riayn PVT LTD\RiyanSite\riyan"

rsync -avz --progress \
  ./wp-content/uploads/ \
  pi@<tailscale-ip>:/data/docker-volumes/riyan-wp-content/uploads/
```

**Transfer time:** ~10-15 minutes (1.4GB over Tailscale)

### Ongoing Operations

After initial setup:
- ✅ All new uploads happen directly on Pi via Directus
- ✅ No manual syncing required
- ✅ Media is persisted in `/data/docker-volumes/riyan-wp-content/`

### Re-syncing Media (if needed)

If you need to sync updated media from development:

```bash
# On dev machine
rsync -avz --progress \
  ./wp-content/uploads/ \
  pi@<tailscale-ip>:/data/docker-volumes/riyan-wp-content/uploads/
```

---

## Environment Configuration

### Critical Files on Pi

| File | Location | Purpose | In Git? |
|------|----------|---------|---------|
| `.env.pi` | `/data/projects/riyan/.env.pi` | All secrets & configuration | ❌ No (security) |
| MariaDB data | `/data/docker-volumes/riyan-mariadb/` | Database files | ❌ No (too large) |
| Media files | `/data/docker-volumes/riyan-wp-content/` | Uploaded media | ❌ No (too large) |
| Directus uploads | `/data/docker-volumes/riyan-directus-uploads/` | Directus files | ❌ No |

### Creating `.env.pi` (One-Time Setup)

```bash
# SSH to Pi
ssh pi@<tailscale-ip>
cd /data/projects/riyan

# Copy template
cp .env.pi.template .env.pi

# Edit with secure values
nano .env.pi
```

**Required values to set:**
```bash
# Database credentials (generate strong passwords)
MYSQL_ROOT_PASSWORD=your-strong-root-password-20-chars
MYSQL_PASSWORD=your-strong-user-password-20-chars

# Directus security keys (generate random 32+ character strings)
DIRECTUS_KEY=random-32-char-string-here
DIRECTUS_SECRET=another-random-32-char-string

# Directus admin credentials
DIRECTUS_ADMIN_PASSWORD=your-directus-admin-password

# URLs (update with your Tailscale URLs)
DIRECTUS_PUBLIC_URL=https://directus-your-funnel.ts.net
NEXT_PUBLIC_SITE_URL=https://site-your-funnel.ts.net
NEXT_PUBLIC_DIRECTUS_URL=https://directus-your-funnel.ts.net

# Other secrets
REVALIDATE_SECRET=random-string-for-revalidation
DIRECTUS_TOKEN=optional-static-token-if-needed
```

**Security Note:** Never commit `.env.pi` to Git!

---

## Troubleshooting

### Directus Login Issues

**Symptom:** Cannot login to Directus after database import

**Cause:** Database contains different admin credentials than `.env.pi`

**Solution 1: Reset via database**
```bash
ssh pi@<tailscale-ip>
docker exec -it riyan_mariadb mysql -u root -p

USE riyan_nextjs;
SELECT * FROM directus_users WHERE email = 'admin@riyan.com.mv';

# Note the user ID, then update password
# Generate hash: https://argon2.online/ or use Directus to get hash
UPDATE directus_users
SET password = '$argon2id$v=19$m=65536,t=3,p=4$...'
WHERE email = 'admin@riyan.com.mv';

exit;
```

**Solution 2: Recreate admin via environment variables**
```bash
# Stop all services
docker compose -f docker-compose.pi.yml down

# Edit .env.pi and set DIRECTUS_ADMIN_PASSWORD
nano .env.pi

# Restart services (Directus will recreate admin on startup)
docker compose -f docker-compose.pi.yml --env-file .env.pi up -d
```

---

### Missing Media Files

**Symptom:** Images not loading, 404 errors

**Check if media exists:**
```bash
ssh pi@<tailscale-ip>
ls -lh /data/docker-volumes/riyan-wp-content/uploads/ | head -20
```

**If empty or incomplete:**
```bash
# Re-run media sync from dev machine
rsync -avz --progress \
  ./wp-content/uploads/ \
  pi@<tailscale-ip>:/data/docker-volumes/riyan-wp-content/uploads/
```

---

### Service Won't Start

**Check logs:**
```bash
docker compose -f docker-compose.pi.yml logs -f
```

**Check disk space:**
```bash
df -h /data
```

If disk is full:
```bash
# Clean up old backups
rm /data/backups/riyan/riyan_db_*.sql

# Clean up Docker
docker system prune -a
```

**Check container status:**
```bash
docker compose -f docker-compose.pi.yml ps
```

**Restart specific service:**
```bash
# Restart just one service
docker compose -f docker-compose.pi.yml restart directus

# Or restart all services
docker compose -f docker-compose.pi.yml restart
```

---

### GitHub Actions Deployment Failing

**Check runner status:**
```bash
ssh pi@<tailscale-ip>
sudo systemctl status actions.runner.*
```

**Check runner logs:**
```bash
cd /actions-runner
./run.sh
```

**Common issues:**
- ✅ Check GHCR_TOKEN and GHCR_USERNAME secrets are set in GitHub
- ✅ Verify runner has `dev` label
- ✅ Ensure `.env.pi` exists at `/data/projects/riyan/.env.pi`
- ✅ Check disk space: `df -h /data`

---

### Database Import Hangs

**Symptom:** Import script runs but never completes

**Cause:** Large SQL file or slow Pi

**Solution:**
```bash
# Monitor progress in another terminal
docker exec -it riyan_mariadb mysql -u root -p

SHOW PROCESSLIST;

# Check database size growth
USE riyan_nextjs;
SELECT COUNT(*) FROM news;
SELECT COUNT(*) FROM projects;
```

**For very large imports:**
```bash
# Import with progress indicator
pv /tmp/backup.sql | docker exec -i riyan_mariadb mysql -u root -p riyan_nextjs
```

---

## Health Checks

### Quick Health Check

```bash
ssh pi@<tailscale-ip>
cd /data/projects/riyan

# Check all services
docker compose -f docker-compose.pi.yml ps

# Should show:
# riyan_mariadb    running
# riyan_directus   running
# riyan_web        running
```

### Detailed Health Check

```bash
# Check MariaDB
docker exec riyan_mariadb mysql -u root -p -e "SELECT VERSION();"

# Check Directus
curl -I http://localhost:8055/server/health

# Check Next.js web
curl -I http://localhost:3000

# Check disk usage
df -h /data

# Check container resources
docker stats --no-stream
```

---

## Rollback Procedures

### Rollback Code Deployment

```bash
ssh pi@<tailscale-ip>
cd /data/projects/riyan

# Find previous commit
git log --oneline -10

# Reset to previous commit
git reset --hard <previous-commit-sha>

# Rebuild and restart
docker compose -f docker-compose.pi.yml --env-file .env.pi up -d --build
```

### Rollback Database

```bash
ssh pi@<tailscale-ip>
cd /data/projects/riyan

# List available backups
ls -lh /data/backups/riyan/

# Import previous backup
./scripts/db-import-pi.sh /data/backups/riyan/riyan_db_YYYYMMDD_HHMMSS.sql
```

### Complete Reset (Nuclear Option)

⚠️ **Warning:** This will destroy all data!

```bash
ssh pi@<tailscale-ip>
cd /data/projects/riyan

# Stop and remove all containers and volumes
docker compose -f docker-compose.pi.yml down -v

# Remove all data
sudo rm -rf /data/docker-volumes/riyan-*

# Re-run initial setup from deployment plan
# See: C:\Users\ninet\.claude\plans\swift-sauteeing-honey.md
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

# Rebuild and restart
docker compose -f docker-compose.pi.yml up -d --build

# Stop all services
docker compose -f docker-compose.pi.yml down

# Check resource usage
docker stats
```

### Database Operations

```bash
# Connect to MariaDB
docker exec -it riyan_mariadb mysql -u root -p

# Export database
./scripts/db-export-pi.sh

# Import database
./scripts/db-import-pi.sh /path/to/backup.sql

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

# Check open ports
sudo netstat -tulpn | grep LISTEN
```

---

## Support

### Getting Help

1. **Check logs first:** `docker compose -f docker-compose.pi.yml logs -f`
2. **Review this guide:** Look for similar issues in Troubleshooting section
3. **Check the deployment plan:** See full implementation details in plan file
4. **GitHub Actions logs:** Check workflow runs for deployment issues

### Escalation Path

1. Check service logs
2. Verify environment configuration
3. Test rollback procedures
4. Contact team lead if issue persists

---

## Related Documentation

- **Deployment Plan:** `C:\Users\ninet\.claude\plans\swift-sauteeing-honey.md`
- **Pi Setup Guide:** `db_init/AdamPi-Dev-Server-Guide.md`
- **Docker Compose (Pi):** `docker-compose.pi.yml`
- **Environment Template:** `.env.pi.template`

---

**Last Updated:** 2025-12-28
**Maintained By:** Development Team
