# Social OAuth Setup Guide for Bagami

## 🔧 Google OAuth Setup Instructions

### Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select Project**
   - Create a new project named "Bagami" or select existing one

3. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

### Step 2: Create OAuth 2.0 Credentials

1. **Go to Credentials**
   - Navigate to "APIs & Services" > "Credentials"

2. **Create OAuth Client ID**
   - Click "Create Credentials" > "OAuth Client ID"
   - Choose "Web application"

3. **Configure OAuth Consent Screen** (if prompted)
   - Fill in app name: "Bagami"
   - User support email: your email
   - Developer contact: your email

### Step 3: Configure Authorized URLs

**For Local Development:**
```
Authorized JavaScript origins:
http://localhost:3002

Authorized redirect URIs:
http://localhost:3002/api/auth/callback/google
```

**For Production (update later):**
```
Authorized JavaScript origins:
https://yourdomain.com

Authorized redirect URIs:
https://yourdomain.com/api/auth/callback/google
```

### Step 4: Update Environment Variables

After creating credentials, update your `.env.local` file:

```bash
# Replace these with your actual Google OAuth credentials
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here

# Generate a random secret for production
NEXTAUTH_SECRET=your_random_secret_here
```

### Step 5: Generate NextAuth Secret

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

## 🚀 Testing the Integration

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Visit the auth page:**
   ```
   http://localhost:3002/auth
   ```

3. **Test Google Sign-In:**
   - Click "Sign in with Google" button
   - Complete Google OAuth flow
   - Should redirect to dashboard on success

## 🔍 Troubleshooting

**Common Issues:**

1. **"redirect_uri_mismatch" error:**
   - Ensure redirect URI matches exactly in Google Console
   - Check for trailing slashes or http vs https

2. **"Client ID not found" error:**
   - Verify GOOGLE_CLIENT_ID is correct in .env.local
   - Restart development server after changing .env.local

3. **Session not persisting:**
   - Verify NEXTAUTH_SECRET is set
   - Check NEXTAUTH_URL matches your domain

## 📋 Current Status

✅ NextAuth.js installed and configured
✅ Google provider set up  
✅ Facebook provider set up
✅ Authentication UI integrated
✅ Dashboard created for post-login
⚠️ Waiting for your Google OAuth credentials

## 📚 Additional Setup Guides

- **Facebook OAuth**: See `FACEBOOK_OAUTH_SETUP.md` for Facebook integration
- **Combined Setup**: Both Google and Facebook are ready for configuration

## 🔄 Next Steps

1. Complete Google Cloud Console setup
2. Complete Facebook Developers Console setup  
3. Update .env.local with real credentials for both providers
4. Test both OAuth flows
5. Configure production domains when ready

Both social login integrations are ready - just need your OAuth credentials to be fully functional!