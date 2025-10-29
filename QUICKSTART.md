# Quick Start Guide

Get your BigGrade proxy running on Firebase in 5 minutes!

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Enter project name: `biggrade-proxy` (or your choice)
4. Click through the setup wizard
5. **Copy your Project ID** (shown in project settings)

## Step 2: Update Configuration

Edit `.firebaserc` and replace `your-project-id` with your actual Project ID:

```json
{
  "projects": {
    "default": "biggrade-proxy"
  }
}
```

## Step 3: Install Firebase CLI

```bash
npm install -g firebase-tools
```

## Step 4: Install Dependencies

```bash
cd functions
npm install
cd ..
```

## Step 5: Login to Firebase

```bash
firebase login
```

## Step 6: Deploy

```bash
firebase deploy
```

Wait 2-3 minutes for deployment to complete.

## Step 7: Access Your Site

After deployment, you'll see:

```
✔  Deploy complete!
Hosting URL: https://YOUR-PROJECT-ID.web.app
```

**Visit that URL** and your BigGrade site will be live! 🎉

## Important Notes

### Free Tier Limitations

Firebase's free "Spark" plan has limited Cloud Function invocations. For production use, upgrade to the "Blaze" (pay-as-you-go) plan:

```bash
firebase projects:list
```

Then in Firebase Console → Settings → Usage and billing → Modify plan

### Changing the Target Site

To proxy a different Base44 site, edit `functions/index.js`:

```javascript
const TARGET_URL = 'https://your-site.base44.app';
```

Then redeploy:

```bash
firebase deploy --only functions
```

## Troubleshooting

### Error: "HTTP Error: 403, Firebase Management API has not been used"

Solution: Go to Firebase Console → Settings → Upgrade to Blaze plan (you won't be charged unless you exceed free tier limits)

### Error: "Permission denied"

Solution: Run `firebase login` again

### Site shows loading screen but never loads

Solution: 
1. Check Firebase Console → Functions → Logs
2. Verify you're on Blaze plan (required for Cloud Functions)
3. Make sure `TARGET_URL` in `functions/index.js` is correct

### Base44 branding still visible

Solution:
1. Clear browser cache
2. Try incognito/private browsing mode
3. Wait 1-2 minutes for CDN to update

## Next Steps

- **Custom Domain**: Add your own domain in Firebase Console → Hosting
- **Monitor Usage**: Check Firebase Console → Usage and billing
- **View Logs**: Run `firebase functions:log` to see function logs
- **Local Testing**: Run `cd functions && npm run serve` to test locally

## Need Help?

- Firebase Docs: https://firebase.google.com/docs
- Firebase Support: https://firebase.google.com/support
- GitHub Issues: https://github.com/noonynonny/BigGrade-final/issues
