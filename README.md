# BigGrade Reverse Proxy

A reverse proxy server that wraps the BigGrade Base44 app, hides branding, and keeps your custom domain in the address bar.

## 🎯 What This Does

- ✅ Proxies `biggrade0.base44.app` through your own domain
- ✅ Hides the "Edit with Base44" button and other Base44 branding
- ✅ Handles Google OAuth properly
- ✅ Keeps your domain (not base44.app) in the address bar
- ✅ Injects custom CSS/JavaScript to remove unwanted elements

## 🚀 Quick Start (Deploy to Render.com - Free)

1. **Fork this repository** (if you haven't already)

2. **Sign up at [Render.com](https://render.com)** (free account)

3. **Create a new Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select this repository: `noonynonny/BigGrade-final`
   - Render will auto-detect the configuration
   - Click "Create Web Service"

4. **Wait for deployment** (2-3 minutes)

5. **Access your app** at the provided URL (e.g., `https://biggrade-proxy.onrender.com`)

6. **Add custom domain** (optional):
   - In Render dashboard: Settings → Custom Domain
   - Add your domain (e.g., `biggrade.yourdomain.com`)
   - Update your DNS with the CNAME record Render provides

## 📋 How It Works

```
User visits your domain
        ↓
Reverse Proxy Server (your Render/Railway deployment)
        ↓
Fetches content from biggrade0.base44.app
        ↓
Injects CSS/JS to hide Base44 branding
        ↓
Returns modified content
        ↓
User sees BigGrade without Base44 branding!
```

## 🧪 Test Locally

```bash
git clone https://github.com/noonynonny/BigGrade-final.git
cd BigGrade-final
npm install
npm start
```

Visit `http://localhost:3000` to see the proxy in action.

## 📚 Full Documentation

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for:
- Detailed deployment instructions for multiple platforms
- Custom domain setup
- Troubleshooting
- Cost comparison
- OAuth configuration

## 🔧 Configuration

The proxy server is configured in `server.js`. Key features:

- **Target**: `https://biggrade0.base44.app`
- **Port**: 3000 (configurable via `PORT` environment variable)
- **Branding Removal**: Automatic CSS/JS injection
- **OAuth Handling**: Preserves authentication flow

## 🌐 Deployment Options

| Platform | Difficulty | Free Tier | Deploy Time |
|----------|-----------|-----------|-------------|
| **Render.com** | ⭐ Easy | ✅ Yes | 2-3 min |
| **Railway.app** | ⭐ Easy | ✅ Yes | 2-3 min |
| **Fly.io** | ⭐⭐ Medium | ✅ Yes | 5 min |
| **Heroku** | ⭐⭐ Medium | ❌ No ($5/mo) | 5 min |

**Recommended**: Render.com (easiest setup, generous free tier)

## ⚠️ Important Notes

### Google OAuth

Google OAuth works through the proxy because:
1. The proxy preserves all OAuth redirects
2. Your domain is used throughout the flow
3. No iframe restrictions apply

### Base44 Branding

The proxy hides:
- "Edit with Base44" button (bottom right)
- Base44 logos and links
- Remix/fork buttons
- Other Base44-specific UI elements

If new branding appears, you can update the CSS selectors in `server.js`.

### Performance

The proxy adds minimal latency (~50-100ms) since it:
1. Fetches content from Base44
2. Modifies HTML/CSS/JS
3. Returns to the user

This is normal for reverse proxies and shouldn't affect user experience.

## 🛠️ Customization

### Hide Additional Elements

Edit `server.js` and add CSS selectors to the `hideBase44CSS` section:

```javascript
const hideBase44CSS = `
  <style>
    /* Your custom selectors here */
    .unwanted-element {
      display: none !important;
    }
  </style>
`;
```

### Change Target App

To proxy a different Base44 app, change the `TARGET` constant in `server.js`:

```javascript
const TARGET = 'https://your-app.base44.app';
```

## 📝 Files

- `server.js` - Main proxy server code
- `package.json` - Node.js dependencies
- `render.yaml` - Render.com configuration
- `netlify.toml` - Netlify configuration (for functions)
- `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
- `README.md` - This file

## 🐛 Troubleshooting

### Proxy Not Starting

```bash
npm install  # Reinstall dependencies
npm start    # Try again
```

### Base44 Branding Still Visible

1. Open browser dev tools (F12)
2. Inspect the element
3. Note its class/ID
4. Add it to `server.js` CSS selectors
5. Redeploy

### OAuth Not Working

The proxy preserves OAuth flows. If it's not working:
1. Check browser console for errors
2. Verify your domain is correctly configured
3. Test with the direct Base44 URL to rule out Base44 issues

## 📞 Support

For issues:
1. Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. Review deployment logs on your hosting platform
3. Test locally with `npm start`
4. Open an issue on GitHub

## 📄 License

MIT License - Feel free to use and modify

---

**Ready to deploy?** Head to [Render.com](https://render.com) and follow the Quick Start above!
