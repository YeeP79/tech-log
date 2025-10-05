# Google Cloud / Firebase Console Setup Guide

This guide walks you through setting up the required Google Cloud and Firebase resources for the Tech Log application.

## Prerequisites

- Google Account
- Google Cloud billing account (free tier is sufficient)
- Access to [Firebase Console](https://console.firebase.google.com)
- Access to [Google Cloud Console](https://console.cloud.google.com)

## Step 1: Create Firebase Project

### 1.1 Create New Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"** or **"Create a project"**
3. Enter project details:
   - **Project name**: `tech-log` (or your preferred name)
   - **Project ID**: Will be auto-generated (e.g., `tech-log-xxxxx`)
     - ⚠️ **IMPORTANT**: Copy this Project ID - you'll need it later
   - **Analytics**: Enable Google Analytics (recommended but optional)
4. Click **"Create project"**
5. Wait for project creation (takes ~30 seconds)

### 1.2 Verify Project Creation

1. You should see your new project in the Firebase Console
2. Note down the **Project ID** (shown in Project Settings)

---

## Step 2: Enable Required Services

### 2.1 Enable Firebase Hosting

1. In Firebase Console, select your project
2. Navigate to **Build** → **Hosting** (left sidebar)
3. Click **"Get started"**
4. Follow the wizard (you can skip the CLI steps for now)
5. Click **"Finish"**

### 2.2 Enable Cloud Firestore

1. Navigate to **Build** → **Firestore Database**
2. Click **"Create database"**
3. **Choose "Start in production mode"** ✅ (RECOMMENDED)

   **Why production mode?**
   - ✅ **Secure by default**: Denies all access until you deploy rules
   - ✅ **Infrastructure as Code**: We deploy security rules from `infrastructure/firestore.rules`
   - ✅ **No time limits**: Rules stay active (test mode expires after 30 days)
   - ✅ **Best practice**: Aligns with production-ready development

   **What about test mode?**
   - ❌ **Insecure**: Allows all read/write access for 30 days
   - ❌ **Temporary**: Auto-locks after 30 days (can break your app)
   - ❌ **Not needed**: We're managing rules in code anyway

   **Don't worry about "production mode" being locked down** - our deployment script (`npm run deploy:firestore`) will deploy the correct security rules from the repo.

4. Select a location:
   - Choose the region closest to your users
   - **Recommended**: `us-central1` (free tier eligible)
   - ⚠️ **IMPORTANT**: Location cannot be changed later
5. Click **"Enable"**
6. Wait for database creation (~1 minute)

### 2.3 Enable Firebase Authentication

1. Navigate to **Build** → **Authentication**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable **Google** sign-in provider:
   - Click on **"Google"**
   - Toggle **"Enable"**
   - Set **Support email**: Your email address

   **Optional Advanced Settings** (you'll see these in the Google provider config):
   - **Safelist client IDs**: Leave blank ❌ (not needed)
   - **Web client ID (auto created by Google Service)**: Leave as-is ✅ (Firebase auto-generates)
   - **Web client secret**: Leave blank ❌ (not needed for web apps)

   **When would you need these?**
   - These are for advanced OAuth 2.0 scenarios (e.g., integrating existing Google OAuth clients)
   - For basic Firebase Authentication with domain restriction, Firebase handles everything automatically
   - Domain restriction is enforced in code via the `hd` parameter (implemented in Phase 1)

   - Click **"Save"**

### 2.4 Configure Authorized Domains (Web Hosting)

This section is about **web hosting domains** (where your app is hosted), NOT email domain restriction.

1. Still in **Authentication** → **Settings** tab
2. Scroll to **"Authorized domains"**
3. **You'll see these domains already added by Firebase:**
   - `localhost` ✅ (for local development)
   - `YOUR_PROJECT_ID.firebaseapp.com` ✅ (auto-added)
   - `YOUR_PROJECT_ID.web.app` ✅ (auto-added)

4. **Do you need to add anything?**
   - **For testing**: No, the defaults are fine ✅
   - **For custom domain**: Add it later when you set up custom domain (e.g., `app.yourcompany.com`)

**What about email domain restriction (e.g., only @yourcompany.com can sign in)?**

That's controlled by code, not here:
- **For testing with personal Gmail**: Set `NEXT_PUBLIC_ALLOWED_DOMAIN=gmail.com` in `.env.local` ✅ (already configured)
- **For production**: Set `NEXT_PUBLIC_ALLOWED_DOMAIN=yourcompany.com` in `.env.local`
- This will be enforced in code via the `hd` parameter (implemented in Phase 1)

### 2.5 Enable Cloud Functions for Firebase

1. Navigate to **Build** → **Functions**
2. Click **"Get started"** (if shown)
3. Click **"Upgrade project"** to enable Cloud Functions
   - ⚠️ **CREDIT CARD REQUIRED**: Functions require Blaze (pay-as-you-go) plan
   - 💳 **What this means**: Google needs a credit card on file, but...
   - 🆓 **You won't be charged**: Free tier is 2M invocations/month
   - 📊 **Expected usage**: ~1K invocations/month (well below free tier)
   - 💰 **Billing only starts**: If you exceed 2M invocations/month
4. Set up billing:
   - Click **"Upgrade"**
   - Select or create a billing account (adds credit card)

   - **Budget setup** (Google may ask for a budget amount):

     **⚠️ IMPORTANT: Understanding How Google Cloud Billing Works**

     Before you choose, please understand this:

     **What is a "budget" in Google Cloud?**
     - A budget is an **email notification threshold** only
     - It does NOT stop charges or limit spending
     - It does NOT prevent your credit card from being charged
     - Think of it like a "low fuel warning light" in your car - it warns you, but doesn't stop the car

     **What happens WITHOUT a budget:**
     - If you stay under free tier (2M function calls/month) → $0 charged ✅
     - If you exceed free tier → Google automatically charges your credit card 💳
     - You get a bill at end of month (no warning beforehand) ⚠️
     - Your site keeps working normally

     **What happens WITH a budget (e.g., $10/month):**
     - If you stay under free tier (2M function calls/month) → $0 charged ✅
     - If you approach the budget → Google sends you EMAIL ALERTS at 50%, 90%, 100% of budget 📧
     - If you exceed the budget → Google STILL charges your credit card 💳
     - Your site keeps working normally
     - The budget gives you WARNING EMAILS so you can investigate

     **For this project:**
     - Expected usage: ~1,000 function calls/month
     - Free tier: 2,000,000 function calls/month
     - You're using **0.05% of free tier** - extremely unlikely to be charged
     - Budget is just a safety net in case something unexpected happens (e.g., infinite loop)

     **Choose one:**

     **Option A: Set a budget of $10/month (RECOMMENDED)** ✅
     - Set budget amount: `$10`
     - You'll get email alerts if costs approach this amount
     - Gives you early warning to investigate issues
     - **Best for peace of mind**
     - Click **"Continue"**

     **Option B: Skip budget setup** ⚠️
     - Click **"Skip this step"**
     - No email alerts if costs increase
     - You can add a budget later: GCP Console → Billing → Budgets
     - **Only choose this if you'll monitor billing manually**

   - Confirm upgrade
   - ✅ You're now on Blaze plan with free tier active

5. Return to Functions page - it should now be enabled

---

## Step 3: Get Firebase Configuration

### 3.1 Get Web App Config

1. In Firebase Console, click ⚙️ (Settings) → **Project settings**
2. Scroll down to **"Your apps"** section
3. **Check if you already have a web app:**

   **If you see an app already listed** (e.g., "tech log dev app"): ✅
   - Firebase auto-created this when you enabled Hosting - perfect!
   - **Skip to step 4** below to get the config values
   - No need to create a new app

   **If "Your apps" section is empty**:
   - Click **"Add app"** → Select **Web** (</> icon)
   - Register app:
     - **App nickname**: `tech-log-web` (or your preference)
     - **Firebase Hosting**: ✅ Check this box
     - Click **"Register app"**

4. **Get your Firebase configuration values:**

   **For existing app:**
   - Find your app in the "Your apps" list
   - Look for the **Config** radio button or code icon (`</>`) and click it
   - You'll see the `firebaseConfig` object with all values

   **For newly created app:**
   - Firebase will display your configuration immediately after registration

5. **You'll see this configuration** (with YOUR actual values):

   **⚠️ IMPORTANT**: This code snippet is **shown to you by Firebase Console** - copy the actual values from your screen!

   ```javascript
   // This is what Firebase shows you (with YOUR actual values):
   const firebaseConfig = {
     apiKey: "AIzaSyC...",                           // Web API key (shown in Firebase Console)
     authDomain: "tech-log-abc123.firebaseapp.com",  // Your project's auth domain
     projectId: "tech-log-abc123",                   // Your unique project ID
     storageBucket: "tech-log-abc123.appspot.com",   // Cloud Storage bucket
     messagingSenderId: "987654321",                 // Cloud Messaging sender ID
     appId: "1:987654321:web:a1b2c3d4e5f6"          // Your web app ID
   };
   ```

   **Where each value comes from** (all visible in the Firebase Console screen):
   - `apiKey`: Firebase Web API Key (unique to your project)
   - `authDomain`: Auto-generated as `YOUR_PROJECT_ID.firebaseapp.com`
   - `projectId`: Your Firebase Project ID (same as in Step 1)
   - `storageBucket`: Auto-generated as `YOUR_PROJECT_ID.appspot.com`
   - `messagingSenderId`: Numeric ID for Cloud Messaging
   - `appId`: Unique identifier for this web app

6. **Copy all six values** from the Firebase Console screen

7. **Next steps:**
   - If you created a new app: Click **"Continue to console"**
   - If you're viewing an existing app's config: You're done! Just copy the values and move to section 3.2 below

### 3.2 Save Configuration Values

**What to do in this step:**

You need to **save your Firebase configuration values** from Step 3.1 so you can use them later in Step 6.3 when creating your `.env.local` file.

**Choose one option:**

1. **Copy values to a text file** (Notepad, TextEdit, etc.) - RECOMMENDED ✅
   - Create a temporary text file called `firebase-config.txt`
   - Copy all 6 values from the Firebase Console
   - Save it somewhere safe (Desktop, Documents, etc.)
   - You'll reference this when creating `.env.local` in Step 6.3

2. **Take a screenshot** 📸
   - Screenshot the Firebase config from the Console
   - Save it somewhere you can find it later

3. **Keep the Firebase Console tab open** 🌐
   - Just leave the browser tab open
   - You can come back to it in Step 6.3

**Reference table - How Firebase values map to environment variables:**

When you create your `.env.local` file in Step 6.3, you'll use this mapping:

| Firebase Config Value | Environment Variable Name | Example |
|----------------------|---------------------------|---------|
| `apiKey` | `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyC...` |
| `authDomain` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `tech-log-abc123.firebaseapp.com` |
| `projectId` | `FIREBASE_PROJECT_ID` **AND** `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `tech-log-abc123` |
| `storageBucket` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `tech-log-abc123.appspot.com` |
| `messagingSenderId` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `987654321` |
| `appId` | `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:987654321:web:a1b2c3d4` |

**💡 TIP**: If you lose these values, you can always find them again:
1. Go to Firebase Console → Project Settings (⚙️ icon)
2. Scroll to **"Your apps"** section
3. Find your web app (e.g., "tech log dev app")
4. Click **"Config"** radio button to see the values
5. Or look under **"SDK setup and configuration"** section

---

## Step 4: Create Service Account

This is needed for GitHub Actions to deploy your app.

### 4.1 Generate Service Account Key

1. Go to **Google Cloud Console**: https://console.cloud.google.com
2. Select your project (top dropdown)
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Click **"Create Service Account"**
5. Service account details:
   - **Name**: `github-actions-deployer`
   - **Description**: Service account for GitHub Actions deployments
   - Click **"Create and continue"**
6. Grant roles (what permissions this service account has):
   - Select role: **Firebase Admin** (type "Firebase Admin" in search)
   - Click **"+ Add another role"**
   - Select role: **Cloud Functions Admin**
   - Click **"+ Add another role"**
   - Select role: **Service Account User**
   - Click **"Continue"**

7. **Grant users access to this service account (optional)**

   **What does this mean?**

   This step is asking: **"Which people/users should be allowed to USE this service account?"**

   Think of the service account like a shared company credit card:
   - **Step 6** (above) = What the credit card can buy (Firebase, Functions, etc.)
   - **Step 7** (this step) = Who is authorized to use the credit card

   **Business use cases:**

   - **Multiple developers**: Grant your dev team access so they can deploy manually if needed
   - **Service account admins**: Designate who can modify this service account's permissions
   - **Cross-team access**: Allow other teams (QA, DevOps) to use this account for their workflows
   - **Audit trail**: Track which specific people used the service account

   **What to do for DEVELOPMENT/TESTING (your current setup):**

   **Leave this section BLANK** ✅ (Click "Done" without adding anyone)

   Why?
   - This is your personal test project
   - Only GitHub Actions needs to use this service account (via the secret key)
   - You don't need other people accessing it
   - Simpler and more secure

   **What to do for PRODUCTION (later when owner sets up):**

   **Option A: Leave blank** (RECOMMENDED for most small teams) ✅
   - GitHub Actions is the only thing that needs to use this
   - Keeps it simple and secure
   - Choose this unless you have specific needs below

   **Option B: Grant access to key team members** (for larger teams)
   - Add email addresses of:
     - **Service Account User**: Developers who may need to deploy manually
     - **Service Account Admin**: Tech lead who manages permissions
   - Example: Add `devops-lead@yourcompany.com` as Service Account Admin
   - Use case: Emergency deployments, troubleshooting, permission changes

   **For your test environment right now:**
   - Leave this blank
   - Click **"Done"**

### 4.2 Download Service Account Key

1. Find your new service account in the list
2. Click the ⋮ (three dots) menu → **"Manage keys"**
3. Click **"Add key"** → **"Create new key"**
4. Select **JSON** format
5. Click **"Create"**
6. **Save the downloaded JSON file securely** - you'll need it for GitHub Secrets

   **📝 Note about authentication:**
   - The service account JSON file you just downloaded is the **modern, recommended way** to authenticate GitHub Actions with Firebase
   - Firebase has deprecated the older `firebase login:ci` token method
   - You'll use this JSON file in Step 5.2 when setting up GitHub Secrets

---

## Step 5: Configure Repository

### 5.1 Update `.firebaserc`

1. Open `.firebaserc` in your repo
2. Replace `YOUR_FIREBASE_PROJECT_ID` with your actual Project ID:

```json
{
  "projects": {
    "default": "tech-log-xxxxx"  // ← Your actual Project ID
  }
}
```

3. Commit and push this change

### 5.2 Set GitHub Secrets

**How to add GitHub Secrets (step-by-step):**

1. **Open your repository on GitHub.com**:
   - Go to `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`
   - Example: `https://github.com/ryanhartman/tech-log`

2. **Navigate to Secrets settings**:
   - Click the **"Settings"** tab (top menu bar of your repo)
   - In the left sidebar, scroll down to the **"Security"** section
   - Click **"Secrets and variables"** (it will expand)
   - Click **"Actions"** under it

3. **You'll see the "Actions secrets and variables" page**

4. **Add each secret one at a time**:
   - Click the green **"New repository secret"** button (top right)
   - **Name**: Enter the exact secret name (e.g., `FIREBASE_PROJECT_ID`)
   - **Secret**: Paste the value
   - Click **"Add secret"**
   - Repeat for each secret below

**Add these secrets (one at a time):**

**Required secrets:**

| Secret Name | Value | Where to find it |
|-------------|-------|------------------|
| `FIREBASE_PROJECT_ID` | `tech-log-xxxxx` | Firebase Console → Project Settings |
| `FIREBASE_SERVICE_ACCOUNT` | `{...entire JSON...}` | Downloaded service account JSON file (Step 4.2) ✅ RECOMMENDED |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIza...` | Firebase config object (Step 3.1) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `tech-log-xxxxx.firebaseapp.com` | Firebase config object (Step 3.1) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `tech-log-xxxxx.appspot.com` | Firebase config object (Step 3.1) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789` | Firebase config object (Step 3.1) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:123456789:web:abcdef` | Firebase config object (Step 3.1) |
| `NEXT_PUBLIC_ALLOWED_DOMAIN` | `gmail.com` (for testing) or `yourcompany.com` (for production) | Your email domain for authentication |

**⚠️ Note:** You only need the secrets listed in the "Required secrets" table above. The deprecated `FIREBASE_TOKEN` secret is no longer needed since we're using the modern service account method.

### 5.3 Set Local Environment Variables

**How to create `.env.local` file (step-by-step):**

1. **Open your project in your code editor** (VS Code, etc.)

2. **Find the project root directory**:
   - This is the top-level folder of your repo
   - Where you see `package.json`, `firebase.json`, `.firebaserc`, etc.
   - Example path: `/Users/ryanhartman/Projects/personal/tech-log/`

3. **Create a new file named `.env.local`**:
   - In VS Code: Right-click in the Explorer sidebar → "New File" → Type `.env.local`
   - Or terminal: `touch .env.local` (from project root)
   - **IMPORTANT**: The filename must start with a dot (`.`) and be exactly `.env.local`

4. **Copy this template into `.env.local`**:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tech-log-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tech-log-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tech-log-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Authentication
NEXT_PUBLIC_ALLOWED_DOMAIN=yourcompany.com

# For Firebase CLI
FIREBASE_PROJECT_ID=tech-log-xxxxx
```

5. **Replace the placeholder values** with your actual Firebase config values from Step 3.1

6. **Save the file**

⚠️ **IMPORTANT**:
- Never commit `.env.local` to Git (it's already in `.gitignore`)
- This file contains sensitive API keys - keep it secret
- If you accidentally commit it, rotate your Firebase API keys immediately

---

## Step 6: Verify Setup

### 6.1 Test Local Configuration

```bash
# Validate environment
npm run deploy:validate

# Should output: ✅ Environment validation passed!
```

### 6.2 Test Firebase CLI Connection

```bash
# Login to Firebase
npx firebase login

# List projects (should show your project)
npx firebase projects:list

# Use your project
npx firebase use default
```

---

## Step 7: Deploy!

### 7.1 Deploy from Local

```bash
# Deploy everything
npm run deploy:all

# Or deploy individually:
npm run deploy:web        # Next.js app only
npm run deploy:functions  # Cloud Functions only
npm run deploy:firestore  # Firestore rules only
```

### 7.2 Verify Deployment

After deployment, you should see:

```
✅ All post-deployment tests passed!

📋 Deployment Information:

   🌐 Hosting URL: https://tech-log-xxxxx.web.app
   🔥 Firebase Console: https://console.firebase.google.com/project/tech-log-xxxxx
   📊 Firestore Data: https://console.firebase.google.com/project/tech-log-xxxxx/firestore
```

Visit the Hosting URL to see your deployed app!

---

## Troubleshooting

### Error: "Firebase project not found"
- Check `.firebaserc` has correct Project ID
- Run `npx firebase use default` to set active project

### Error: "Insufficient permissions"
- Verify service account has correct roles
- Re-download service account key and update GitHub Secret

### Error: "Billing account required"
- Cloud Functions require Blaze (pay-as-you-go) plan
- Don't worry - free tier is generous (2M invocations/month)

### Error: "Domain not authorized"
- Add your domain to Firebase Authentication → Settings → Authorized domains

---

## Next Steps

After setup is complete:

1. ✅ Push code to GitHub - workflows will auto-deploy
2. ✅ View deployment in Firebase Console
3. ✅ Start building features (Phase 1: Authentication)

---

## Cost Estimate (Free Tier)

With **50 pilots** submitting **10 logs/month each**:

- **Firestore**: ~500 writes/month (FREE - under 20K/day limit)
- **Hosting**: <100 MB bandwidth/day (FREE - under 360 MB/day limit)
- **Functions**: ~1K invocations/month (FREE - under 2M/month limit)
- **Auth**: Unlimited (FREE)

**Expected monthly cost: $0** 🎉

---

## Security Best Practices

✅ **Never commit** service account keys to Git

✅ **Use GitHub Secrets** for all sensitive credentials

✅ **Rotate tokens** periodically (every 90 days recommended)

✅ **Enable 2FA** on your Google account

✅ **Review IAM permissions** quarterly

---

## Support

**Firebase Documentation**: https://firebase.google.com/docs
**GCP Documentation**: https://cloud.google.com/docs
**GitHub Actions**: https://docs.github.com/actions

For project-specific issues, see `infrastructure/README.md`
