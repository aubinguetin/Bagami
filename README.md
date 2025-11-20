# Bagami

A modern business application with authentication built using Next.js, React, and Tailwind CSS.

## Features

- 🔐 **Complete Authentication System**: Login, signup, and password reset functionality
- 📱 **Phone-First Authentication**: Primary login using Burkina Faso phone numbers (+226)
- 📧 **Flexible Input**: Tab-based selection between phone and email registration
- 🌍 **Global Support**: 240+ countries with searchable country selection
- 🔍 **Smart Search**: Real-time country filtering by name, code, or dial code
- 🔢 **OTP Verification**: 6-digit SMS verification with auto-fill and resend functionality
- 🔑 **Password Recovery**: Forgot password with phone/email options
- 🎨 **Modern UI**: Clean, professional design with Bagami branding
- 📱 **Responsive Design**: Works seamlessly on all device sizes
- ✅ **Smart Validation**: Real-time validation with user-friendly error messages
- 🔒 **Security Features**: Password visibility toggle and secure form handling
- 🌍 **Community Focus**: Designed for the community-powered delivery platform
- 🚀 **Fast Performance**: Built with Next.js 13 App Router

## Design System

### Brand Colors
- **Primary Orange**: `#FF6B35` - Main accent color for buttons and highlights
- **Navy Blue**: `#2C3E50` - Primary text and logo color
- **Light Gray**: `#F8F9FA` - Background and subtle elements
- **Dark Gray**: `#6C757D` - Secondary text

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

## Getting Started

### Prerequisites
- Node.js 16.0 or later
- npm or yarn package manager

### Installation

1. Install dependencies:
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

2. Run the development server:
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Mobile Development (Capacitor)

### Prerequisites
- Android Studio (for Android)
- Xcode (for iOS, macOS only)
- Capacitor CLI (installed locally)

### Syncing
After installing new dependencies or building the web app, sync the native projects:
```bash
npm run build
npx cap sync
```

### Running on Android
To open the project in Android Studio:
```bash
npx cap open android
```
Or to run directly on a connected device/emulator:
```bash
npx cap run android
```

### Running on iOS
To open the project in Xcode:
```bash
npx cap open ios
```
Or to run directly on a connected device/simulator:
```bash
npx cap run ios
```

### Live Reload
To enable live reload during development:
1. Ensure your device is on the same network as your computer, or use a tunnel like `ngrok`.
2. Update `capacitor.config.ts`:
   ```typescript
   server: {
     url: "http://YOUR_LOCAL_IP:3000", // or your ngrok URL
     cleartext: true
   }
   ```
3. Run the native app. It will load the content from the specified URL.


## Project Structure

```
src/
├── app/
│   ├── auth/           # Authentication pages
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # Reusable components
├── styles/            # Additional stylesheets
└── assets/            # Static assets
\`\`\`

## Authentication Features

### 🔐 Login Page
- **Primary Input**: Phone number (+226 XX XX XX XX) or email address
- **Smart Validation**: Automatically detects Burkina Faso phone format
- **Password Security**: Toggle visibility with eye icon
- **Remember Me**: Persistent login option
- **Quick Access**: Forgot password link
- **Social Login**: Google and Facebook integration (ready for implementation)

### 📝 Signup Page
- **Contact Method Tabs**: Easy toggle between phone number and email registration
- **Global Country Codes**: Searchable dropdown with 240+ countries, Burkina Faso default
- **Smart Input Fields**: Dynamic form fields based on selected contact method
- **Simplified Process**: Only full name, contact info, and password required
- **No Password Confirmation**: Streamlined single password entry
- **Phone Verification**: Automatic OTP sending for phone registrations
- **Legal Compliance**: Terms of service and privacy policy agreement
- **Social Signup**: Ready for Google and Facebook integration

#### **Phone Number Tab**
- **Comprehensive Country List**: All 240+ countries and territories included
- **Smart Search**: Real-time filtering by country name, country code, or dial code  
- **Visual Flags**: Country flag emojis for easy identification
- **Keyboard Navigation**: ESC to close, search-as-you-type functionality
- **Auto-Complete**: Click outside or select to close dropdown
- **Burkina Faso Default**: +226 BF pre-selected for local users
- **Separate Phone Input**: Clean number entry without country code

### 🔑 Forgot Password
- **Flexible Input**: Phone number or email address
- **Smart Routing**: SMS for phones, email for email addresses
- **Visual Feedback**: Success confirmation with masked contact info
- **OTP Integration**: Seamless flow to OTP verification for phone numbers
- **Email Fallback**: Full email instructions for email-based recovery

### 🔒 Change Password (Settings)
- **Access**: Settings → Password
- **Flow**: Enter current password, new password, and confirm new
- **Validation**: Enforces 8+ chars, upper/lowercase, number, and special character
- **Security**: Requires current password if one is already set; OAuth users can set a password without current one
- **API**: POST `/api/user/change-password`

### ✅ Form Validation
- **Real-time Validation**: Using react-hook-form and Yup schemas
- **Burkina Faso Phone Format**: Supports +226, 00226, or 226 prefixes
- **Custom Error Messages**: User-friendly validation feedback
- **Visual Indicators**: Clear error states and success feedback
- **Accessibility**: Proper labeling and keyboard navigation

## Technologies Used

- **Framework**: Next.js 13 with App Router
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form
- **Validation**: Yup
- **Icons**: Lucide React
- **Language**: TypeScript

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.