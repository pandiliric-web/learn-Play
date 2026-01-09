# What to Commit to GitHub

## ✅ **DO Commit These Files:**

### Source Code
- ✅ All `.js`, `.jsx`, `.css` files in `src/` and `server/src/`
- ✅ `package.json` and `package-lock.json` (both root and server/)
- ✅ Configuration files: `render.yaml`, `README.md`, etc.

### Project Files
- ✅ `public/` folder (HTML, images, manifest, etc.)
- ✅ Documentation files (`.md` files)
- ✅ `.gitignore` file

### Example:
```
✅ src/
✅ server/src/
✅ server/server.js
✅ package.json
✅ render.yaml
✅ DEPLOYMENT.md
✅ public/
```

## ❌ **DON'T Commit These Files:**

### Dependencies (Auto-installed)
- ❌ `node_modules/` (too large, auto-installed)
- ❌ `server/node_modules/` (too large, auto-installed)

### Build Output
- ❌ `build/` folder (generated, not needed)

### Secrets & Environment Variables
- ❌ `.env` files (contain passwords, API keys)
- ❌ `server/.env` (contains MongoDB URI, JWT secret, etc.)

### Temporary Files
- ❌ `uploads/` folder (user-uploaded files)
- ❌ Log files (`*.log`)

### System Files
- ❌ `.DS_Store` (Mac system file)
- ❌ IDE files (`.vscode/`, `.idea/`)

## 🔒 **Why Not Commit .env Files?**

Your `.env` files contain **SECRETS**:
- MongoDB password
- JWT secret
- Email passwords
- API keys

**If you commit these, anyone can see your secrets!** 🔐

## ✅ **Your .gitignore Already Handles This!**

Your `.gitignore` file automatically excludes:
- `node_modules/`
- `build/`
- `.env` files
- `uploads/`

So when you run `git add .`, these files won't be included.

## 📝 **Quick Checklist Before Committing:**

```bash
# Check what will be committed
git status

# Make sure you see:
✅ Source code files
✅ package.json files
✅ Configuration files
✅ Documentation

# Make sure you DON'T see:
❌ node_modules/
❌ .env
❌ build/
❌ uploads/
```

## 🚀 **Safe Commands:**

```bash
# This is safe - .gitignore will exclude unwanted files
git add .

# Or be explicit:
git add src/ server/ package.json render.yaml *.md
git add public/

# Commit
git commit -m "Add Render deployment configuration"

# Push
git push
```

## ⚠️ **If You Already Committed Secrets:**

If you accidentally committed `.env` files:

1. **Remove them from Git:**
   ```bash
   git rm --cached .env
   git rm --cached server/.env
   ```

2. **Update .gitignore** (already done ✅)

3. **Commit the removal:**
   ```bash
   git commit -m "Remove .env files from repository"
   ```

4. **Change your secrets immediately:**
   - Change MongoDB password
   - Generate new JWT_SECRET
   - Change email passwords

## 📦 **What Render Needs:**

When Render deploys, it will:
1. Clone your repository
2. Run `npm install` (installs `node_modules/`)
3. Build your app (creates `build/` folder)
4. Use environment variables you set in Render dashboard

**You don't need to commit:**
- `node_modules/` (Render installs it)
- `build/` (Render builds it)
- `.env` (You set these in Render dashboard)

---

**TL;DR:** Commit your source code and config files. Don't commit `node_modules/`, `.env`, or `build/`. Your `.gitignore` already handles this! ✅
