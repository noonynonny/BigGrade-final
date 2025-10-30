# Reverse Proxy Deployment Guide

This guide explains how to deploy the BigGrade reverse proxy server that hides Base44 branding and keeps your custom domain in the address bar.

## What This Does

The reverse proxy server:
- ✅ Proxies all requests to `biggrade0.base44.app`
- ✅ Injects CSS/JavaScript to hide the "Edit with Base44" button
- ✅ Handles Google OAuth properly
- ✅ Keeps your custom domain in the address bar
- ✅ Removes Base44 branding elements

## Deployment Options

### Option 1: Render.com (Recommended - Free Tier Available)

1. **Sign up** at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `noonynonny/BigGrade-final`
4. Render will automatically detect the `render.yaml` configuration
5. Click "Create Web Service"
6. Wait for deployment (2-3 minutes)
7. Your proxy will be available at: `https://biggrade-proxy.onrender.com`

**Custom Domain Setup:**
- In Render dashboard, go to Settings → Custom Domain
- Add your domain (e.g., `biggrade.yourdomain.com`)
- Update your DNS with the provided CNAME record

### Option 2: Railway.app (Free Tier Available)

1. **Sign up** at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `noonynonny/BigGrade-final`
4. Railway will automatically detect Node.js and deploy
5. Go to Settings → Generate Domain
6. Your proxy will be available at the generated URL

**Custom Domain Setup:**
- In Settings, add your custom domain
- Update your DNS with the provided CNAME record

### Option 3: Fly.io (Free Tier Available)

1. **Install Fly CLI**: `curl -L https://fly.io/install.sh | sh`
2. **Login**: `fly auth login`
3. **Deploy**:
   ```bash
   cd /path/to/BigGrade-final
   fly launch
   fly deploy
   ```
4. Your proxy will be available at: `https://biggrade-proxy.fly.dev`

### Option 4: Heroku (Paid - $5/month minimum)

1. **Install Heroku CLI**: `npm install -g heroku`
2. **Login**: `heroku login`
3. **Deploy**:
   ```bash
   cd /path/to/BigGrade-final
   heroku create biggrade-proxy
   git push heroku main
   ```
4. Your proxy will be available at: `https://biggrade-proxy.herokuapp.com`

## Testing Locally

Before deploying, you can test the proxy locally:

```bash
cd /path/to/BigGrade-final
npm install
npm start
```

Then visit `http://localhost:3000` in your browser.

## Updating Netlify to Point to Your Proxy

Once your proxy is deployed, you have two options:

### Option A: Use Netlify as a Simple Redirect

Update your Netlify site to redirect to your proxy server:

1. Create a simple `public/index.html`:
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <meta http-equiv="refresh" content="0;url=https://your-proxy-url.com">
   </head>
   <body>
     <p>Redirecting...</p>
   </body>
   </html>
   ```

### Option B: Point Your Custom Domain Directly to the Proxy

1. Remove the Netlify site
2. Point your domain's DNS directly to your proxy server
3. Users will access BigGrade directly through your proxy

## How It Works

```
User Request
    ↓
Your Domain (biggrade.yourdomain.com)
    ↓
Reverse Proxy Server
    ↓
Fetches content from biggrade0.base44.app
    ↓
Injects CSS/JS to hide Base44 branding
    ↓
Returns modified content to user
    ↓
User sees BigGrade without Base44 branding
```

## Troubleshooting

### Google OAuth Not Working

If Google OAuth still doesn't work, it's because Google blocks OAuth in proxied contexts. The proxy server includes `allow-top-navigation` which should allow OAuth to break out and complete authentication.

### Base44 Branding Still Visible

The proxy injects CSS and JavaScript to hide Base44 elements. If some elements are still visible:
1. Inspect the element in browser dev tools
2. Note its class/ID
3. Add it to the CSS in `server.js`
4. Redeploy

### Performance Issues

The proxy adds a small latency (50-100ms) since it fetches content from Base44 and modifies it. This is normal for reverse proxies.

## Cost Comparison

| Platform | Free Tier | Paid Tier | Custom Domain |
|----------|-----------|-----------|---------------|
| Render.com | ✅ 750 hours/month | $7/month | ✅ Free |
| Railway.app | ✅ $5 credit/month | $5/month | ✅ Free |
| Fly.io | ✅ 3 VMs free | $1.94/month | ✅ Free |
| Heroku | ❌ | $5/month | ✅ Free |

## Recommended Setup

1. **Deploy to Render.com** (easiest, free tier)
2. **Add custom domain** (e.g., `app.yourdomain.com`)
3. **Update DNS** to point to Render
4. **Test OAuth** to ensure it works
5. **Monitor** for any Base44 branding that slips through

## Support

If you encounter issues:
1. Check the deployment logs on your hosting platform
2. Test locally with `npm start`
3. Inspect the browser console for errors
4. Check if Base44 changed their HTML structure

## Next Steps

1. Choose a deployment platform (Render.com recommended)
2. Deploy the proxy server
3. Test that BigGrade works
4. Verify Base44 branding is hidden
5. Test Google OAuth
6. Add your custom domain
