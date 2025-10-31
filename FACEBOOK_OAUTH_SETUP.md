# Facebook OAuth Setup Guide for Bagami

## 🔧 Complete Facebook Setup Instructions

### Step 1: Facebook Developers Console Setup

1. **Go to Facebook Developers**
   - Visit: https://developers.facebook.com/

2. **Create Developer Account** (if needed)
   - Click "Get Started" and complete verification
   - May require phone number verification

3. **Create New App**
   - Click "Create App" 
   - Choose "Consumer" (for user authentication)
   - App Name: "Bagami"
   - Contact Email: your email
   - Click "Create App"

### Step 2: Configure Facebook Login

1. **Add Facebook Login Product**
   - In your app dashboard, click "Add Product"
   - Find "Facebook Login" and click "Set Up"

2. **Configure Facebook Login Settings**
   - Go to "Facebook Login" > "Settings"
   - Enable "Client OAuth Login": Yes
   - Enable "Web OAuth Login": Yes

### Step 3: Set Valid OAuth Redirect URIs

**For Local Development:**
```
Valid OAuth Redirect URIs:
http://localhost:3002/api/auth/callback/facebook
```

**For Production (update later):**
```
Valid OAuth Redirect URIs:
https://yourdomain.com/api/auth/callback/facebook
```

### Step 4: Get Your App Credentials

1. **Go to App Settings**
   - Click "Settings" > "Basic" in left sidebar

2. **Find Your Credentials**
   - **App ID**: Copy this value
   - **App Secret**: Click "Show" and copy this value

### Step 5: Update Environment Variables

Update your `.env.local` file with the actual Facebook credentials:

```bash
# Facebook OAuth Configuration
FACEBOOK_CLIENT_ID=your_actual_facebook_app_id_here
FACEBOOK_CLIENT_SECRET=your_actual_facebook_app_secret_here
```

### Step 6: Configure App Domains (Important!)

1. **In Facebook App Settings > Basic**
   - App Domains: `localhost` (for development)
   - Site URL: `http://localhost:3002`

2. **For Production (later)**
   - App Domains: `yourdomain.com`
   - Site URL: `https://yourdomain.com`

### Step 7: App Review & Permissions

**For Development:**
- Your app can be used by you and other developers/testers
- No review needed for basic login

**For Production:**
- Facebook Login is approved by default
- For additional permissions (like email), you may need app review
- Current setup requests: public_profile, email

## 🚀 Testing the Integration

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Visit the auth page:**
   ```
   http://localhost:3002/auth
   ```

3. **Test Facebook Sign-In:**
   - Click "Sign in with Facebook" button
   - Complete Facebook OAuth flow
   - Should redirect to dashboard on success

## 🔍 Troubleshooting

**Common Issues:**

1. **"App Not Setup" error:**
   - Ensure Facebook Login product is added to your app
   - Check that OAuth redirect URI is correctly configured

2. **"Invalid redirect_uri" error:**
   - Verify redirect URI matches exactly in Facebook settings
   - Check for trailing slashes or http vs https

3. **"App ID not found" error:**
   - Verify FACEBOOK_CLIENT_ID is correct in .env.local
   - Restart development server after changing .env.local

4. **"This app is in development mode" warning:**
   - Normal for development - only you can test it
   - Add other testers in App Roles if needed

## 📋 Current Implementation

✅ Facebook provider added to NextAuth
✅ Facebook Sign-In button created
✅ UI integrated with existing auth flow
✅ Environment variables configured
⚠️ Waiting for your Facebook App credentials

## 🔐 Security Notes

- Keep your App Secret secure and never commit it to version control
- Facebook Login provides access to user's public profile and email
- User can revoke access anytime from their Facebook settings

## 🔄 Next Steps

1. Complete Facebook Developers Console setup
2. Update .env.local with real Facebook credentials  
3. Test the Facebook OAuth flow
4. Configure production domains when ready

The Facebook integration is ready - just needs your Facebook App credentials to be fully functional!