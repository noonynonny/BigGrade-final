# Google OAuth Fix for Iframe Embedding

## Problem
When embedding the BigGrade Base44 app in an iframe on Netlify, Google Sign-In fails because:
1. Google blocks OAuth authentication in iframes by default for security reasons (prevents clickjacking)
2. The iframe lacks proper permissions to open popups or navigate to Google's authentication pages

## Solution
Added the `sandbox` attribute to the iframe with specific permissions:

```html
<iframe 
  id="app-frame" 
  src="https://biggrade0.base44.app"
  sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-top-navigation-by-user-activation"
  allow="camera; microphone; clipboard-read; clipboard-write; fullscreen; payment; geolocation"
  style="display: none;"
></iframe>
```

## Sandbox Permissions Explained

- **`allow-same-origin`**: Allows the iframe to access its own origin's resources (cookies, localStorage, etc.)
- **`allow-scripts`**: Enables JavaScript execution within the iframe
- **`allow-popups`**: Allows the iframe to open popup windows (needed for OAuth)
- **`allow-popups-to-escape-sandbox`**: Allows popups opened by the iframe to NOT inherit the sandbox restrictions
- **`allow-forms`**: Allows form submission (needed for login forms)
- **`allow-top-navigation-by-user-activation`**: Allows the iframe to navigate the top-level window when triggered by user action (like clicking the Google Sign-In button)

## How It Works

When a user clicks "Continue with Google":
1. The iframe can now open a popup window for Google OAuth
2. The popup escapes the sandbox restrictions and can complete the authentication flow
3. After successful authentication, the callback returns to the Base44 app
4. The user is logged in and can use the application

## Alternative Approaches

If this doesn't fully resolve the issue, consider:

1. **Popup-based OAuth**: Modify the Base44 app to explicitly use popup-based OAuth instead of redirects
2. **Top-level navigation**: Allow the OAuth flow to break out of the iframe entirely
3. **Direct access**: Encourage users to access the Base44 app directly instead of through the iframe wrapper

## Deployment

After making these changes:
1. Commit and push to GitHub
2. Netlify will automatically redeploy
3. Test the Google Sign-In functionality
