# Tech Log Infrastructure

Infrastructure as Code (IaC) configuration for the Tech Log application using Firebase and Google Cloud Platform.

## 🏗️ Architecture

```
┌─────────────────┐
│  GitHub Actions │  ← CI/CD Pipeline
└────────┬────────┘
         │
         ├─── Deploy Web App ──────► Firebase Hosting (Next.js)
         ├─── Deploy Functions ────► Cloud Functions (Node.js 22)
         └─── Deploy Firestore ────► Firestore Rules & Indexes
                                      │
                                      └─► Cloud Firestore Database
```

## 📁 Directory Structure

```
infrastructure/
├── README.md                    # This file
├── GOOGLE_CONSOLE_SETUP.md      # Step-by-step GCP/Firebase setup guide
├── firestore.rules              # Firestore security rules (declarative)
└── firestore.indexes.json       # Database indexes for query optimization

scripts/deploy/
├── validate-env.ts              # Environment validation (SRP)
├── pre-deploy.ts                # Pre-deployment checks (SRP)
└── post-deploy.ts               # Post-deployment validation (SRP)

.github/workflows/
├── deploy-web.yml               # Web app deployment (SRP)
├── deploy-functions.yml         # Functions deployment (SRP)
└── deploy-firestore.yml         # Firestore config deployment (SRP)
```

## 🚀 Quick Start

### Prerequisites

1. **Complete Initial Setup**: Follow [GOOGLE_CONSOLE_SETUP.md](./GOOGLE_CONSOLE_SETUP.md) first
2. **Update `.firebaserc`**: Replace `YOUR_FIREBASE_PROJECT_ID` with your actual project ID
3. **Set Environment Variables**: Create `.env.local` with Firebase credentials (see setup guide)
4. **Configure GitHub Secrets**: Add required secrets to your repository (see setup guide)

### Local Deployment

```bash
# Validate environment configuration
npm run deploy:validate

# Run pre-deployment checks (lint, typecheck)
npm run deploy:pre

# Deploy web app only
npm run deploy:web

# Deploy Cloud Functions only
npm run deploy:functions

# Deploy Firestore rules and indexes only
npm run deploy:firestore

# Deploy everything at once
npm run deploy:all

# Run post-deployment validation
npm run deploy:post
```

### Firebase Emulator (Local Development)

```bash
# Start all Firebase emulators
npm run emulator

# Access emulator UI at http://localhost:4000
# - Auth: http://localhost:9099
# - Firestore: http://localhost:8080
# - Functions: http://localhost:5001
# - Hosting: http://localhost:5000
```

## 🔐 Firestore Security Rules

### Current Status: Locked Down

All Firestore collections are currently **locked down** (deny all read/write). This is intentional for Phase 0.

```javascript
// infrastructure/firestore.rules
match /{document=**} {
  allow read, write: if false;  // 🔒 Locked until auth is implemented
}
```

### Phase 1: Authentication

Security rules will be updated to allow authenticated users:

```javascript
match /tech_logs/{submissionId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && isOwner();
  allow update: if canEditSubmission();
}
```

### Helper Functions (Already Defined)

The security rules include these helper functions, ready for Phase 1:

- `isAuthenticated()` - Check if user is logged in
- `isAdmin()` - Check if user has admin role
- `isOwner(userId)` - Check if user owns the document
- `canEditSubmission(submission)` - Check if user can edit a submission

## 📊 Firestore Indexes

Indexes are pre-configured for common queries:

```json
{
  "collectionGroup": "tech_logs",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

**Current indexes**:
- Query logs by user + creation date
- Query logs by aircraft + date
- Query logs by email + creation date

**Note**: Firestore will auto-suggest additional indexes as needed during development.

## 🔄 CI/CD Workflows

All workflows follow **Single Responsibility Principle** and deploy automatically on push to `main`.

### `deploy-web.yml` - Web App Deployment

**Triggers**:
- Push to `main` with changes in `apps/web/**` or `libs/**`
- Manual workflow dispatch

**Steps**:
1. Checkout code
2. Setup Node.js 22
3. Install dependencies
4. Run pre-deployment checks
5. Build Next.js app
6. Deploy to Firebase Hosting
7. Run post-deployment validation

**Secrets Required**:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT`
- All `NEXT_PUBLIC_FIREBASE_*` variables

### `deploy-functions.yml` - Cloud Functions Deployment

**Triggers**:
- Push to `main` with changes in `apps/functions/**` or `libs/**`
- Manual workflow dispatch

**Steps**:
1. Checkout code
2. Setup Node.js 22
3. Install dependencies
4. Run pre-deployment checks
5. Build Cloud Functions
6. Deploy to Cloud Functions

**Secrets Required**:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_TOKEN`

### `deploy-firestore.yml` - Firestore Configuration

**Triggers**:
- Push to `main` with changes in `infrastructure/firestore.*`
- Manual workflow dispatch

**Steps**:
1. Checkout code
2. Validate environment
3. Deploy Firestore rules
4. Deploy Firestore indexes

**Secrets Required**:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_TOKEN`

## 🛡️ SOLID Principles in Infrastructure

### Single Responsibility Principle (SRP)
- ✅ Each workflow deploys ONE target (web/functions/firestore)
- ✅ Each script has ONE job (validate/check/verify)
- ✅ Firestore rules are separate from app code

### Open/Closed Principle (OCP)
- ✅ Can add new deployment targets without modifying existing workflows
- ✅ Can extend Firestore rules without changing infrastructure

### Dependency Inversion Principle (DIP)
- ✅ Scripts depend on environment variables (abstractions), not hardcoded values
- ✅ Workflows depend on secrets, not inline credentials

### Interface Segregation Principle (ISP)
- ✅ Separate workflows allow deploying only what changed
- ✅ Teams can trigger web deployment without affecting functions

## 📦 Deployment Scripts (TypeScript)

### `validate-env.ts` - Environment Validation

**Purpose**: Validate all required environment variables and Firebase configuration

**Usage**:
```bash
npm run deploy:validate
```

**Checks**:
- ✅ Firebase Project ID is set and not placeholder
- ✅ `.firebaserc` exists and is configured
- ✅ All required environment variables exist
- ⚠️ Warns about missing optional variables

### `pre-deploy.ts` - Pre-Deployment Checks

**Purpose**: Run quality checks before deployment

**Usage**:
```bash
npm run deploy:pre
```

**Checks**:
- ✅ Environment validation
- ✅ Linting (all projects)
- ✅ Type checking (strict mode)
- ⏭️ Tests (when implemented)

**Exit Codes**:
- `0` - All checks passed, safe to deploy
- `1` - Checks failed, deployment blocked

### `post-deploy.ts` - Post-Deployment Validation

**Purpose**: Verify deployment was successful

**Usage**:
```bash
npm run deploy:post
```

**Checks**:
- ✅ Firebase Hosting is accessible (HTTP 200)
- ✅ Firestore configuration deployed
- 📊 Display deployment URLs and console links

## 🔒 Security Best Practices

### Secrets Management

✅ **DO**:
- Store all sensitive data in GitHub Secrets
- Use different service accounts for different environments
- Rotate Firebase tokens every 90 days
- Enable 2FA on Google account

❌ **DON'T**:
- Commit `.env.local` to Git
- Share service account keys via email/Slack
- Hardcode credentials in code
- Use the same credentials for dev and prod

### Firestore Security

✅ **DO**:
- Start with deny-all rules (we did this!)
- Test rules using Firebase Emulator
- Use helper functions to keep rules DRY
- Deploy rules with every code change

❌ **DON'T**:
- Enable test mode in production
- Trust client-side validation alone
- Skip security rules for "just a quick test"
- Allow `match /{document=**} { allow read, write: if true; }`

## 🌍 Environment Variables

### Required for Deployment

| Variable | Description | Source |
|----------|-------------|--------|
| `FIREBASE_PROJECT_ID` | Firebase project identifier | Firebase Console → Project Settings |
| `FIREBASE_TOKEN` | CI/CD token for deployments | `firebase login:ci` |
| `FIREBASE_SERVICE_ACCOUNT` | JSON service account key | GCP IAM → Service Accounts |

### Required for Client (Next.js)

| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key | Firebase Console → Project Settings → Web App |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID | Firebase Console → Project Settings |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID | Firebase Console → Project Settings |
| `NEXT_PUBLIC_ALLOWED_DOMAIN` | Domain restriction | Your company domain (e.g., `company.com`) |

## 📈 Monitoring & Debugging

### Firebase Console Links

Once deployed, access these consoles:

- **Hosting**: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/hosting`
- **Firestore**: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore`
- **Functions**: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/functions`
- **Authentication**: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/authentication`

### Logs

```bash
# View Hosting logs
npx firebase hosting:channel:list

# View Function logs
npx firebase functions:log

# Stream Function logs in real-time
npx firebase functions:log --only functionName

# View Firestore operations (in Console only)
# Go to Firestore → Usage tab
```

## 🐛 Troubleshooting

### Deployment fails with "Project not found"
```bash
# Check active project
npx firebase projects:list

# Set correct project
npx firebase use YOUR_PROJECT_ID
```

### Deployment fails with "Insufficient permissions"
- Check service account has required roles:
  - Firebase Admin
  - Cloud Functions Admin
  - Service Account User

### Firestore rules don't update
```bash
# Force deploy rules
npx firebase deploy --only firestore:rules --force
```

### Environment validation fails
```bash
# Check which variables are missing
npm run deploy:validate

# Verify .firebaserc is configured
cat .firebaserc
```

## 🎯 Next Steps

### Phase 1: Authentication
1. Update Firestore rules to allow authenticated reads
2. Add authentication flow to Next.js app
3. Test with Firebase Emulator
4. Deploy to production

### Phase 2: Core Features
1. Update rules for tech log creation
2. Add edit permission logic
3. Deploy Firestore indexes for queries
4. Test with real data

### Phase 3: Admin Features
1. Add admin role checks to rules
2. Deploy admin-only functions
3. Add audit logging

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Functions Guide](https://firebase.google.com/docs/functions)
- [GitHub Actions Documentation](https://docs.github.com/actions)

---

**Questions?** See [GOOGLE_CONSOLE_SETUP.md](./GOOGLE_CONSOLE_SETUP.md) for initial setup or check the main project README.
