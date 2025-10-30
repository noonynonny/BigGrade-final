# BigGrade - Simple Iframe Wrapper

A simple iframe wrapper for the BigGrade Base44 app that allows Google OAuth to work properly.

## 🎯 What This Does

- Embeds `biggrade0.base44.app` in an iframe on your custom domain
- Allows Google OAuth to work by using `allow-top-navigation`
- Shows your domain (e.g., `biggrade.netlify.app`) in the address bar
- When users click "Continue with Google", the full page navigates to complete OAuth

## 🚀 How It Works

1. User visits your site (e.g., `biggrade.netlify.app`)
2. They see BigGrade embedded in an iframe
3. When they click "Continue with Google":
   - The entire page navigates to Google OAuth (breaks out of iframe)
   - User completes authentication
   - Google redirects back to Base44
   - Base44 loads with the user authenticated

## 📋 Deployment

This is already set up for Netlify:

1. Push changes to GitHub
2. Netlify automatically deploys
3. Visit your site at `https://biggrade.netlify.app`

## ⚙️ Configuration

The iframe uses these sandbox permissions:
- `allow-same-origin` - Allows cookies and storage
- `allow-scripts` - Enables JavaScript
- `allow-forms` - Allows form submission
- `allow-popups` - Allows popup windows
- `allow-top-navigation` - **Key for OAuth** - Allows navigating the parent window
- `allow-modals` - Allows modal dialogs

## 🔧 Customization

To change the embedded app, edit `public/index.html` and change the iframe `src`:

```html
<iframe src="https://your-app.base44.app" ...>
```

## ⚠️ Important Notes

### Google OAuth Behavior

When a user clicks "Continue with Google":
1. The iframe tries to navigate to Google OAuth
2. Because of `allow-top-navigation`, the **entire page** navigates (not just the iframe)
3. User sees Google's login page
4. After login, Google redirects to Base44
5. User is authenticated

This means:
- ✅ OAuth works correctly
- ⚠️ Your domain temporarily disappears during OAuth (shows Base44 domain)
- ✅ After OAuth, user can use the app normally

### Base44 Branding

The "Edit with Base44" button will still be visible because:
- We can't modify content inside the iframe (cross-origin restriction)
- This is Base44's branding requirement for free hosting

To hide it, users would need a browser extension like uBlock Origin.

## 📁 Files

- `public/index.html` - Simple iframe wrapper
- `netlify.toml` - Netlify configuration
- `README.md` - This file

## 🐛 Troubleshooting

### OAuth Shows "Refused to Connect"

If you see this error, it means `allow-top-navigation` isn't working. Make sure:
1. The iframe has the `sandbox` attribute with `allow-top-navigation`
2. You're not blocking popups or navigation in your browser
3. You're using a modern browser (Chrome, Firefox, Safari, Edge)

### Iframe Not Loading

Check:
1. The Base44 URL is correct: `https://biggrade0.base44.app`
2. Your browser allows iframes
3. You don't have extensions blocking iframes

### Base44 Branding Visible

This is expected. The iframe loads Base44's content as-is, including their branding. To hide it:
- Use a browser extension (uBlock Origin) with custom filters
- Or accept the branding as part of using Base44's free hosting

## 📝 License

MIT License - Feel free to use and modify

---

**Live Site:** https://biggrade.netlify.app
