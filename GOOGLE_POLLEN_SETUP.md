# Google Pollen API Setup Guide

This app now supports **Google Pollen API** for global pollen data coverage (65+ countries)!

## 🌍 Why Use Google Pollen API?

- ✅ **Global Coverage**: 65+ countries worldwide
- ✅ **FREE Tier**: 5,000 calls/month
- ✅ **$200 Monthly Credit**: Available until Feb 2025
- ✅ **Automatic Fallback**: Uses Open-Meteo for Europe if no API key

## 📋 Setup Instructions

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"** or select an existing project
3. Give your project a name (e.g., "Breeze Air Quality")

### Step 2: Enable the Pollen API

1. In the Cloud Console, go to **APIs & Services** > **Library**
2. Search for **"Pollen API"**
3. Click on it and press **"Enable"**

### Step 3: Enable Billing (Required for Free Tier)

1. Go to **Billing** in the Cloud Console
2. Link a billing account (credit card required, but you won't be charged within free tier)
3. The $200 monthly credit will be automatically applied

### Step 4: Create an API Key

1. Go to **APIs & Services** > **Credentials**
2. Click **"Create Credentials"** > **"API Key"**
3. Copy your new API key
4. (Optional but recommended) Click **"Restrict Key"**:
   - Under "API restrictions", select "Restrict key"
   - Choose "Pollen API" from the dropdown
   - Under "Application restrictions", you can restrict by HTTP referrers (your domain)

### Step 5: Add API Key to Your App

1. Create a `.env` file in the project root (if it doesn't exist):
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your API key:
   ```
   VITE_GOOGLE_POLLEN_API_KEY=YOUR_API_KEY_HERE
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

## 🎯 How It Works

The app uses a **smart fallback system**:

1. **First**: Tries Google Pollen API (if API key is configured)
   - Shows Tree, Grass, and Weed pollen with 0-5 index scale
   - Works globally in 65+ countries

2. **Fallback**: Uses Open-Meteo API (free, no key needed)
   - Shows 6 specific pollen types (Alder, Birch, Grass, etc.)
   - Only works in Europe

3. **No Data**: Shows helpful message if location not covered

## 💰 Cost Estimate

For a personal app with moderate usage:
- **5,000 free calls/month** = ~167 calls/day
- **$200 monthly credit** covers additional usage
- **Typical cost**: **$0/month** for personal use

## 🔒 Security Best Practices

1. ✅ **Never commit `.env`** to Git (already in `.gitignore`)
2. ✅ **Restrict your API key** in Google Cloud Console
3. ✅ **Set up HTTP referrer restrictions** for production
4. ✅ **Monitor usage** in Google Cloud Console

## 📊 Monitoring Usage

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Dashboard**
3. View your Pollen API usage statistics

## 🚀 Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Add the environment variable in your hosting platform:
   - Variable name: `VITE_GOOGLE_POLLEN_API_KEY`
   - Value: Your Google API key

2. Restrict your API key to your production domain in Google Cloud Console

## 🆘 Troubleshooting

### "Pollen data unavailable"
- Check if your API key is correctly set in `.env`
- Verify the API is enabled in Google Cloud Console
- Check browser console for error messages

### "Google Pollen API error: 403"
- Billing not enabled on your Google Cloud project
- API key restrictions too strict
- Pollen API not enabled

### "Google Pollen API error: 429"
- You've exceeded the free tier (5,000 calls/month)
- Wait for the monthly reset or upgrade your plan

## 📚 Resources

- [Google Pollen API Documentation](https://developers.google.com/maps/documentation/pollen)
- [Pricing Details](https://developers.google.com/maps/billing-and-pricing/pricing#environment-pricing)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Note**: The app works perfectly fine without Google Pollen API! It will automatically use the free Open-Meteo API for European locations.
