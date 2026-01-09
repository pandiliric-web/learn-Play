# Step-by-Step Guide: Push Your Project to GitHub

Follow these steps to upload your LearnPlay project to GitHub.

---

## 📋 **Prerequisites Check**

First, let's check if you have Git installed:

### Option 1: Check if Git is Installed
1. Open **Command Prompt** or **PowerShell**
2. Type: `git --version`
3. If you see a version number (like `git version 2.40.0`), Git is installed ✅
4. If you see "command not found", you need to install Git (see below)

### Option 2: Install Git (if needed)
1. Go to: https://git-scm.com/download/win
2. Download Git for Windows
3. Run the installer (use default settings)
4. Restart your computer
5. Verify installation: Open Command Prompt and type `git --version`

---

## 🚀 **Step-by-Step Instructions**

### **STEP 1: Create a GitHub Account** (if you don't have one)

1. Go to: https://github.com
2. Click **"Sign up"**
3. Enter your email, create a password
4. Verify your email
5. Complete the setup

---

### **STEP 2: Create a New Repository on GitHub**

1. Log in to GitHub
2. Click the **"+"** icon (top right) → **"New repository"**
3. Fill in:
   - **Repository name**: `learnplay` (or any name you like)
   - **Description**: "LearnPlay E-Learning Platform"
   - **Visibility**: Choose **Public** (free) or **Private**
   - ⚠️ **DO NOT** check "Initialize with README" (we already have files)
4. Click **"Create repository"**
5. **Copy the repository URL** - You'll see something like:
   ```
   https://github.com/yourusername/learnplay.git
   ```
   Save this URL - you'll need it later!

---

### **STEP 3: Open Your Project Folder**

1. Open **File Explorer**
2. Navigate to: `C:\Users\User\castone`
3. **Right-click** in the folder → **"Open in Terminal"** or **"Open PowerShell window here"**

   OR

   Open **Command Prompt** or **PowerShell** and type:
   ```bash
   cd C:\Users\User\castone
   ```

---

### **STEP 4: Initialize Git** (if not already done)

Check if Git is already initialized:
```bash
git status
```

**If you see "not a git repository":**
```bash
git init
```

**If you see file listings**, Git is already initialized ✅

---

### **STEP 5: Configure Git** (first time only)

Set your name and email (use your GitHub email):
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

Replace with your actual name and GitHub email.

---

### **STEP 6: Check What Files Will Be Added**

See what files Git will track:
```bash
git status
```

You should see:
- ✅ Your source code files (`src/`, `server/`)
- ✅ Configuration files (`package.json`, `render.yaml`)
- ✅ Documentation files (`.md` files)
- ❌ **NOT** `node_modules/` (excluded by `.gitignore`)
- ❌ **NOT** `.env` files (excluded by `.gitignore`)

---

### **STEP 7: Add All Files**

Add all files to Git:
```bash
git add .
```

This adds all files except those in `.gitignore` (like `node_modules/`, `.env`, etc.)

**Verify what was added:**
```bash
git status
```

You should see a list of files ready to be committed.

---

### **STEP 8: Create Your First Commit**

Commit (save) your files:
```bash
git commit -m "Initial commit: LearnPlay project with Render deployment config"
```

The `-m` flag adds a message describing what you're committing.

---

### **STEP 9: Connect to GitHub**

Connect your local repository to GitHub:
```bash
git remote add origin https://github.com/yourusername/learnplay.git
```

**⚠️ Replace `yourusername/learnplay` with YOUR actual repository URL!**

To verify it was added:
```bash
git remote -v
```

You should see your GitHub URL listed.

---

### **STEP 10: Push to GitHub**

Upload your code to GitHub:
```bash
git branch -M main
git push -u origin main
```

**If this is your first time:**
- GitHub may ask for your username and password
- **Username**: Your GitHub username
- **Password**: Use a **Personal Access Token** (not your GitHub password)

#### **How to Create a Personal Access Token:**

1. Go to GitHub → Click your profile picture (top right)
2. Click **"Settings"**
3. Scroll down → Click **"Developer settings"** (left sidebar)
4. Click **"Personal access tokens"** → **"Tokens (classic)"**
5. Click **"Generate new token"** → **"Generate new token (classic)"**
6. Give it a name: "LearnPlay Project"
7. Select scopes: Check **"repo"** (full control of private repositories)
8. Click **"Generate token"**
9. **COPY THE TOKEN** (you won't see it again!)
10. Use this token as your password when pushing

---

### **STEP 11: Verify Upload**

1. Go to your GitHub repository page
2. Refresh the page
3. You should see all your files! ✅

---

## 🎉 **Success!**

Your project is now on GitHub! You can now:
- Deploy to Render (see `RENDER_QUICK_START.md`)
- Share your code
- Keep it backed up

---

## 📝 **Quick Command Reference**

For future updates, use these commands:

```bash
# Navigate to your project
cd C:\Users\User\castone

# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Description of your changes"

# Push to GitHub
git push
```

---

## ❓ **Troubleshooting**

### **Error: "fatal: not a git repository"**
- Run `git init` first (Step 4)

### **Error: "remote origin already exists"**
- Remove it: `git remote remove origin`
- Then add it again: `git remote add origin YOUR_URL`

### **Error: "Authentication failed"**
- Make sure you're using a Personal Access Token, not your password
- Generate a new token if needed

### **Error: "Permission denied"**
- Check that your repository URL is correct
- Make sure you have access to the repository

### **Want to update your code later?**
```bash
git add .
git commit -m "Your update message"
git push
```

---

## 🔒 **Security Reminder**

Before pushing, make sure:
- ✅ No `.env` files are included (check with `git status`)
- ✅ No passwords or API keys in your code
- ✅ `.gitignore` is working (excludes `node_modules/`, `.env`, etc.)

---

**Need help?** Check the error message and search for it on Google or Stack Overflow!
