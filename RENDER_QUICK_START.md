# Quick Start: Deploy to Render

## 🚀 5-Minute Deployment

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add Render deployment config"
git push
```

### Step 2: Deploy on Render
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml` and create both services

### Step 3: Configure Environment Variables

**Backend Service** → Environment tab:
- `MONGO_URI` - Your MongoDB Atlas connection string
- `EMAIL_USER` - Your Gmail address
- `EMAIL_PASS` - Gmail App Password ([get one here](https://myaccount.google.com/apppasswords))

**Frontend Service:**
- No configuration needed! `REACT_APP_API_URL` is auto-set ✅

### Step 4: Deploy
- Click **"Apply"** or **"Save Changes"**
- Wait 2-5 minutes for deployment
- Done! 🎉

## 📋 Required Environment Variables

### Backend Only:
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/learnplay
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

All other variables are auto-configured! ✨

## 🔗 Your URLs
After deployment, you'll get:
- Frontend: `https://learnplay-frontend.onrender.com`
- Backend: `https://learnplay-backend.onrender.com`

## ⚠️ Important Notes

1. **Gmail Setup**: You need a Gmail App Password (not your regular password)
   - Enable 2FA on Gmail
   - Generate App Password: https://myaccount.google.com/apppasswords

2. **MongoDB Atlas**: 
   - Whitelist IP: `0.0.0.0/0` (or Render's IPs)
   - Get connection string from Atlas dashboard

3. **Free Tier**: Services sleep after 15 min inactivity (first request may be slow)

## 🐛 Troubleshooting

**Backend won't start?**
- Check logs in Render dashboard
- Verify MongoDB connection string
- Ensure all env vars are set

**CORS errors?**
- `CLIENT_ORIGIN` is auto-set, but verify it matches frontend URL

**Need more help?**
- See `DEPLOYMENT.md` for detailed guide
- Check Render logs in dashboard

---

**That's it!** Your app should be live in minutes. 🚀
