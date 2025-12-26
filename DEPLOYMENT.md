# Backend Proxy Deployment Guide

Your Pollen API is now secured via a backend proxy! Here's how to deploy it:

## Option 1: Deploy to Vercel (Recommended - Free)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd /Users/jap/firstApp
   vercel
   ```

3. **Add Environment Variable:**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add: `VITE_GOOGLE_POLLEN_API_KEY` = `your_actual_api_key`
   - Redeploy: `vercel --prod`

4. **Update iOS App:**
   - Open `/Users/jap/BreezeApp/BreezeApp/Services/PollenService.swift`
   - Change line 9 from:
     ```swift
     private let baseURL = "https://your-domain.com/api/pollen"
     ```
   - To your Vercel URL:
     ```swift
     private let baseURL = "https://your-project.vercel.app/api/pollen"
     ```

## Option 2: Deploy to Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   netlify deploy
   ```

3. **Add Environment Variable:**
   - Netlify dashboard → Site settings → Environment variables
   - Add: `VITE_GOOGLE_POLLEN_API_KEY`

## Testing Locally

1. **Start dev server:**
   ```bash
   cd /Users/jap/firstApp
   npm run dev
   ```

2. **Test the proxy:**
   ```bash
   curl "http://localhost:5173/api/pollen?lat=40.7128&lon=-74.0060"
   ```

## For iOS App

Once deployed, update the `baseURL` in `PollenService.swift` to your production URL:

```swift
private let baseURL = "https://your-actual-domain.com/api/pollen"
```

## Security Notes

✅ API key is now server-side only  
✅ Works for both web and iOS apps  
✅ No domain restrictions needed on the API key  
✅ Can add rate limiting if needed  

Your web app will automatically use the proxy at `/api/pollen` (relative URL).
