# BigGrade Firebase Proxy

This project proxies the BigGrade Base44 app (`https://biggrade0.base44.app`) through Firebase Hosting and Cloud Functions, allowing you to host it on your own `.web.app` domain.

## Features

- **Custom Domain**: Host on Firebase `.web.app` domain instead of `.base44.app`
- **Base44 Branding Removal**: Automatically removes Base44 watermarks and branding
- **Full Proxy**: All requests are proxied through Firebase Cloud Functions
- **Session Persistence**: Maintains cookies and session state

## Project Structure

```
BigGrade-final/
├── functions/
│   ├── index.js          # Cloud Function proxy logic
│   └── package.json      # Node.js dependencies
├── public/
│   └── index.html        # Fallback loading page
├── firebase.json         # Firebase configuration
├── .firebaserc           # Firebase project settings
└── README.md             # This file
```

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Firebase CLI**: Install with `npm install -g firebase-tools`
3. **Firebase Account**: Create a free account at [firebase.google.com](https://firebase.google.com)

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., `biggrade-proxy`)
4. Follow the setup wizard (you can disable Google Analytics if you want)
5. Note your **Project ID** (you'll need this in the next step)

### 2. Configure Your Project

Edit the `.firebaserc` file and replace `your-project-id` with your actual Firebase Project ID:

```json
{
  "projects": {
    "default": "biggrade-proxy"
  }
}
```

### 3. Install Dependencies

```bash
cd functions
npm install
cd ..
```

### 4. Login to Firebase

```bash
firebase login
```

This will open a browser window for authentication.

### 5. Deploy to Firebase

```bash
firebase deploy
```

This will deploy both the hosting and cloud functions. The process may take a few minutes.

### 6. Access Your Site

After deployment, you'll see output like:

```
✔  Deploy complete!

Hosting URL: https://biggrade-proxy.web.app
Function URL: https://us-central1-biggrade-proxy.cloudfunctions.net/proxy
```

Visit your **Hosting URL** (e.g., `https://biggrade-proxy.web.app`) to access your proxied BigGrade site!

## Configuration

### Change Target URL

To proxy a different Base44 site, edit `functions/index.js` and change the `TARGET_URL`:

```javascript
const TARGET_URL = 'https://your-site.base44.app';
```

Then redeploy:

```bash
firebase deploy --only functions
```

### Custom Domain

To use your own custom domain (e.g., `biggrade.com`):

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow the instructions to verify ownership and configure DNS

## Troubleshooting

### "Permission denied" errors

Make sure you're logged in to Firebase CLI:
```bash
firebase login
```

### Functions not deploying

Check that you're on a Firebase plan that supports Cloud Functions. The free "Spark" plan has limited function invocations. Consider upgrading to the "Blaze" (pay-as-you-go) plan.

### Site not loading

1. Check the Firebase Console → Functions → Logs for errors
2. Verify the `TARGET_URL` in `functions/index.js` is correct
3. Make sure the Base44 site is publicly accessible

### Base44 branding still showing

The proxy includes aggressive branding removal code. If you still see Base44 elements:

1. Check browser console for errors
2. Try clearing your browser cache
3. Open an incognito/private window

## Development

### Local Testing

To test functions locally:

```bash
cd functions
npm run serve
```

### View Logs

```bash
firebase functions:log
```

## Cost Considerations

Firebase has a free tier (Spark plan) with limited Cloud Function invocations. For production use, consider upgrading to the Blaze (pay-as-you-go) plan. Typical costs:

- **Hosting**: Free for most use cases
- **Cloud Functions**: ~$0.40 per million invocations
- **Bandwidth**: First 10GB/month free, then $0.15/GB

Monitor your usage in the Firebase Console.

## License

This is a proxy configuration for educational purposes. Ensure you have the right to proxy the target Base44 site.

## Support

For Firebase-specific issues, see [Firebase Documentation](https://firebase.google.com/docs).

For Base44-related questions, contact Base44 support.
