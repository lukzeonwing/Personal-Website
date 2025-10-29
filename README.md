# Jarvis Portfolio Website

A portfolio website with Node.js backend and React frontend.

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Copy the example file and edit it:
```bash
cp server/.env.example server/.env
nano server/.env
```

**Required settings:**
```bash
# Generate a secure JWT secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Edit server/.env:
DOMAIN=your-domain.com          # Your domain (leave empty for localhost only)
JWT_SECRET=<paste-generated-secret>
ADMIN_USERNAME=your-username
ADMIN_PASSWORD=your-password
```

### 3. Build Production Files
```bash
npm run build
```

### 4. Start Services

**Option A: Using systemd (Production)**

The services are already configured. Just restart them:
```bash
./restart-services.sh
```

Your site will be available at:
- Frontend: `http://your-domain:3000`
- Backend API: `http://your-domain:4000`

**Option B: Development Mode**

Start frontend (port 5173):
```bash
npm run dev
```

Start backend in another terminal (port 4000):
```bash
npm run server
```

## That's It!

- **Admin login:** Use the username/password you set in `.env`
- **View logs:** `sudo journalctl -u jarvis-website -f`
- **After code changes:** Run `npm run build` then `./restart-services.sh`

For detailed security features and API documentation, see `IMPROVEMENTS.md`.
  
