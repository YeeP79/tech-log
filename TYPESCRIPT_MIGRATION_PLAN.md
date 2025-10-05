# Aircraft Tech Log - TypeScript Migration Plan

## Overview

Migrate from Google Forms + Python to a fully custom TypeScript solution using NX monorepo, Next.js, and Firebase, deployable on GCP free tier.

## Architecture

### Tech Stack

**Monorepo:**
- **NX Workspace** - Monorepo tooling
- **GitHub** - Source control
- **GitHub Actions** - CI/CD

**Frontend:**
- **Next.js 14** (App Router)
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Firebase Hosting** or **Cloud Run** (free tier)

**Backend:**
- **Firebase Firestore** - Database
- **Firebase Authentication** - Auth (Google Sign-In)
- **Cloud Functions (TypeScript)** - Background processing

**Infrastructure:**
- **Firebase** - Hosting, Auth, Firestore
- **GCP Free Tier** - Cloud Functions, Cloud Run

### Domain Restriction

- Firebase Auth configured for Google Sign-In
- Domain restriction: `hd: "company.com"` (only company domain)
- Admin users stored in Firestore `admins` collection

## NX Monorepo Structure

```
tech-log-nx/
├── apps/
│   ├── web/                    # Next.js app
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx    # User's submissions
│   │   │   │   └── layout.tsx
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx    # Admin panel
│   │   │   │   ├── users/
│   │   │   │   └── submissions/
│   │   │   ├── new-log/
│   │   │   │   └── page.tsx    # Create new tech log
│   │   │   ├── edit/[id]/
│   │   │   │   └── page.tsx    # Edit submission
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── firebase.ts
│   │   │   └── hooks/
│   │   └── public/
│   └── functions/              # Cloud Functions
│       ├── src/
│       │   ├── index.ts
│       │   ├── scheduled/
│       │   │   └── cleanup.ts  # Cleanup old data
│       │   └── triggers/
│       │       └── onSubmissionCreate.ts
│       └── package.json
├── libs/
│   ├── shared-types/           # Shared TypeScript types
│   │   └── src/
│   │       ├── tech-log.types.ts
│   │       ├── user.types.ts
│   │       └── form-config.types.ts
│   ├── firebase-admin/         # Firebase Admin SDK utils
│   │   └── src/
│   │       ├── firestore.ts
│   │       └── auth.ts
│   └── form-schema/            # Form configuration
│       └── src/
│           ├── schema.ts       # From form_config.json
│           └── validation.ts
├── .github/
│   └── workflows/
│       ├── deploy-web.yml
│       └── deploy-functions.yml
├── firebase.json
├── .firebaserc
├── nx.json
└── package.json
```

## Reference Python Implementation

The following Python files contain logic that should be ported to TypeScript:

- **`form_config.json`** - Form schema (use as-is in TypeScript)
- **`admin_control.py`** - Edit permission logic to port to TypeScript
- **`parse_form_responses.py`** - Response parsing logic (reference for derived field calculations)
- **`create_google_form.py`** - Form structure (already captured in form_config.json)

### Key Logic to Port

From `admin_control.py`:
- `EditPermissionManager.can_edit()` → TypeScript `checkEditPermission()`
- `EditPermissionManager.grant_edit_extension()` → Cloud Function
- `EditPermissionManager.has_admin_permission()` → Firestore rule + TypeScript helper

From `parse_form_responses.py`:
- `calculate_derived_fields()` → Client-side TypeScript calculations
- `parse_response()` → Form submission handler

## Data Models (TypeScript)

### Tech Log Submission

```typescript
interface TechLogSubmission {
  id: string;
  responseId: string;

  // User info
  userId: string;
  userEmail: string;

  // Aircraft & flight info
  aircraftRegistration: string;
  logNumber: string;
  date: string;
  pic: string;
  obsSic?: string;
  company: string;
  fromLocation: string;
  toLocation: string;
  takeoffHobbs: number;
  landingHobbs: number;
  totalHobbs: number;

  // Tach & inspection
  forwardedTachTime: number;
  nextDueTachTime: number;
  hrsRemaining: number;
  inspectType: string;

  // Checklist (boolean fields)
  checklistAircraftCleanliness: boolean;
  checklistEngineOil: boolean;
  // ... other checklist items

  // Fuel & oil
  fuelOnboard: number;
  fuelRequired: number;
  fuelReserve: number;
  // ... other fuel fields

  // Engine monitoring
  magDrop1Left?: number;
  magDrop1Right?: number;
  // ... other engine fields

  // Discrepancies
  squawk1?: string;
  squawk2?: string;
  squawk3?: string;

  // Certifications
  postInspectionDate: string;
  postInspectionPilotCert: string;
  postInspectionSignature: string;
  preflightCertDate: string;
  preflightCertPilotCert: string;
  preflightCertSignature: string;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  canEdit: boolean;
  editUntil: Timestamp;
  isLocked: boolean;
}
```

### User Model

```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAdmin: boolean;
  createdAt: Timestamp;
}
```

### Edit Permission

```typescript
interface EditPermission {
  submissionId: string;
  grantedBy: string;
  extensionHours: number;
  reason: string;
  grantedAt: Timestamp;
  expiresAt: Timestamp;
}
```

## Firebase Configuration

### Firestore Collections

```
/tech_logs/{submissionId}
/users/{uid}
/admins/{email}
/edit_permissions/{permissionId}
/locks/{submissionId}
/system_config/edit_settings
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
             exists(/databases/$(database)/documents/admins/$(request.auth.token.email));
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function canEdit(submission) {
      return (isOwner(submission.userId) &&
              submission.canEdit &&
              !submission.isLocked) ||
             isAdmin();
    }

    // Tech logs
    match /tech_logs/{submissionId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() &&
                       request.resource.data.userId == request.auth.uid;
      allow update: if canEdit(resource.data);
      allow delete: if isAdmin();
    }

    // Users
    match /users/{uid} {
      allow read: if isAuthenticated();
      allow write: if isOwner(uid) || isAdmin();
    }

    // Admins
    match /admins/{email} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Edit permissions
    match /edit_permissions/{permissionId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Locks
    match /locks/{submissionId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // System config
    match /system_config/{docId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}
```

### Firebase Auth Configuration

```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google Sign-In with domain restriction
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  hd: process.env.NEXT_PUBLIC_ALLOWED_DOMAIN, // e.g., "company.com"
  prompt: 'select_account'
});
```

## Authentication Flow

### User Login

1. User clicks "Sign in with Google"
2. Firebase Auth redirects to Google OAuth
3. Domain restriction validates email domain
4. On success, create/update user in Firestore
5. Check if user is admin (query `admins` collection)
6. Redirect to dashboard

### Domain Restriction Implementation

```typescript
// lib/auth.ts
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_DOMAIN!;

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const email = result.user.email;

    // Verify domain
    if (!email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
      await auth.signOut();
      throw new Error(`Only ${ALLOWED_DOMAIN} emails are allowed`);
    }

    return result.user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}
```

## Edit Permission Logic

### Client-Side Check

```typescript
// lib/permissions.ts
import { Timestamp } from 'firebase/firestore';

interface EditCheck {
  canEdit: boolean;
  reason: string;
}

export function checkEditPermission(
  submission: TechLogSubmission,
  userEmail: string,
  isAdmin: boolean
): EditCheck {
  // Admins can always edit
  if (isAdmin) {
    return { canEdit: true, reason: 'Admin override' };
  }

  // Check ownership
  if (submission.userEmail !== userEmail) {
    return { canEdit: false, reason: 'Not your submission' };
  }

  // Check if locked
  if (submission.isLocked) {
    return { canEdit: false, reason: 'Submission is locked' };
  }

  // Check edit window
  const now = Timestamp.now();
  if (submission.editUntil.toMillis() < now.toMillis()) {
    return { canEdit: false, reason: 'Edit window expired' };
  }

  return { canEdit: true, reason: 'Within edit window' };
}
```

### Server-Side Enforcement (Cloud Function)

```typescript
// functions/src/triggers/onSubmissionUpdate.ts
import * as functions from 'firebase-functions';
import { checkEditPermission } from '@tech-log/shared-utils';

export const validateSubmissionUpdate = functions.firestore
  .document('tech_logs/{submissionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Get user making the change
    const auth = context.auth;
    if (!auth) {
      throw new Error('Unauthorized');
    }

    // Check permissions
    const canEdit = await checkEditPermission(
      before,
      auth.token.email,
      await isAdmin(auth.token.email)
    );

    if (!canEdit.canEdit) {
      // Revert the change
      await change.after.ref.set(before);
      throw new Error(`Edit denied: ${canEdit.reason}`);
    }
  });
```

## Deployment Strategy

### GitHub Actions Workflows

#### Deploy Web App

```yaml
# .github/workflows/deploy-web.yml
name: Deploy Web App

on:
  push:
    branches: [main]
    paths:
      - 'apps/web/**'
      - 'libs/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npx nx build web
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          NEXT_PUBLIC_ALLOWED_DOMAIN: ${{ secrets.ALLOWED_DOMAIN }}

      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
```

#### Deploy Cloud Functions

```yaml
# .github/workflows/deploy-functions.yml
name: Deploy Cloud Functions

on:
  push:
    branches: [main]
    paths:
      - 'apps/functions/**'
      - 'libs/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build functions
        run: npx nx build functions

      - name: Deploy to Cloud Functions
        uses: google-github-actions/deploy-cloud-functions@v1
        with:
          name: tech-log-functions
          runtime: nodejs18
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.FIREBASE_PROJECT_ID }}
          source_dir: dist/apps/functions
```

### Firebase Hosting Configuration

```json
// firebase.json
{
  "hosting": {
    "public": "dist/apps/web/out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "functions": {
    "source": "dist/apps/functions",
    "runtime": "nodejs18"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

## Free Tier Limits & Optimization

### Firebase (Free Spark Plan)

**Hosting:**
- 10 GB storage
- 360 MB/day bandwidth
- Custom domain supported

**Firestore:**
- 1 GB storage
- 50K reads/day
- 20K writes/day
- 20K deletes/day

**Authentication:**
- Unlimited (phone auth limited to 10K verifications/month)

**Cloud Functions:**
- 2M invocations/month
- 400K GB-seconds, 200K GHz-seconds compute time
- 5 GB network egress

### Optimization Strategies

1. **Pagination**: Load submissions in batches (10-20 per page)
2. **Caching**: Use React Query with stale-while-revalidate
3. **Indexes**: Create composite indexes for common queries
4. **Static Generation**: Pre-render public pages
5. **CDN**: Leverage Firebase Hosting CDN

### Estimated Usage (50 pilots, 10 logs/month each)

- **Writes**: 500/month (well under 20K/day)
- **Reads**: ~15K/month (well under 50K/day)
- **Storage**: ~50 MB (well under 1 GB)
- **Functions**: ~1K invocations/month (well under 2M)

**Cost: $0/month** ✅

## Implementation Phases

### Phase 1: Setup & Authentication (Week 1)

- [ ] Create NX workspace
- [ ] Set up Firebase project
- [ ] Configure Firebase Auth with domain restriction
- [ ] Build login page
- [ ] Implement auth context/hooks
- [ ] Set up Firestore security rules

### Phase 2: Core Features (Week 2)

- [ ] Create tech log form using form_config.json schema
- [ ] Build submission flow
- [ ] Implement dashboard (view submissions)
- [ ] Add edit functionality with permission checks
- [ ] Calculate derived fields (client-side)

### Phase 3: Admin Features (Week 3)

- [ ] Build admin panel
- [ ] User management (view all users)
- [ ] Submission management (view all submissions)
- [ ] Grant edit extensions
- [ ] Lock/unlock submissions
- [ ] Set global edit window

### Phase 4: Polish & Deploy (Week 4)

- [ ] Add loading states & error handling
- [ ] Implement responsive design
- [ ] Set up GitHub Actions
- [ ] Deploy to production
- [ ] Test with real users
- [ ] Documentation

## Key Features

### For Pilots (Regular Users)

1. **Dashboard**
   - View all their submissions
   - See edit status (can edit / locked / expired)
   - Filter by aircraft, date range

2. **Create New Log**
   - Dynamic form based on form_config.json
   - Auto-calculations (total Hobbs, fuel uplift)
   - Real-time validation

3. **Edit Submission**
   - Edit within allowed timeframe
   - See countdown timer for edit window
   - Request extension from admin (future)

### For Admins

1. **User Management**
   - View all users
   - Promote/demote admins
   - View user activity

2. **Submission Management**
   - View all submissions (filterable)
   - Export data (CSV/JSON)
   - Advanced search

3. **Permission Management**
   - Grant edit extensions
   - Lock submissions
   - Set global edit window
   - Audit log

## Migration from Current System

### Data Migration

If you have existing data from Google Forms:

1. Export form responses to CSV
2. Create migration script:

```typescript
// scripts/migrate-data.ts
import { formResponseToTechLog } from './parsers';
import { db } from './firebase-admin';

async function migrateData(csvPath: string) {
  const responses = await parseCSV(csvPath);

  for (const response of responses) {
    const techLog = formResponseToTechLog(response);
    await db.collection('tech_logs').add(techLog);
  }
}
```

3. Run migration: `npm run migrate -- path/to/responses.csv`

### Gradual Rollout

1. **Week 1**: Deploy to staging, test with 2-3 pilots
2. **Week 2**: Add more test users, gather feedback
3. **Week 3**: Full rollout, deprecate Google Forms
4. **Week 4**: Monitor, fix issues, optimize

## Development Commands

```bash
# Install dependencies
npm install

# Start web app (dev)
npx nx serve web

# Start functions emulator
npx nx serve functions

# Build all
npx nx run-many --target=build --all

# Test all
npx nx run-many --target=test --all

# Deploy web
npm run deploy:web

# Deploy functions
npm run deploy:functions

# Deploy all
npm run deploy:all
```

## Environment Variables

### Local Development (.env.local)

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

# Auth
NEXT_PUBLIC_ALLOWED_DOMAIN=company.com

# Functions
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/key.json
```

### GitHub Secrets

Required secrets in GitHub repo settings:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `ALLOWED_DOMAIN`
- `FIREBASE_SERVICE_ACCOUNT` (JSON)
- `GCP_SA_KEY` (for Cloud Functions)

## Next Steps

1. **Create new GitHub repo**: `tech-log-nx`
2. **Initialize NX workspace**:
   ```bash
   npx create-nx-workspace@latest tech-log-nx \
     --preset=next \
     --appName=web \
     --style=tailwind
   ```
3. **Add Firebase**: `npm install firebase firebase-admin`
4. **Set up project structure** as outlined above
5. **Implement Phase 1** (auth & setup)

## Success Criteria

- ✅ Free tier usage (no monthly costs)
- ✅ Domain-restricted authentication
- ✅ Edit permission system working
- ✅ Admin controls functional
- ✅ Mobile responsive
- ✅ < 2 second page loads
- ✅ Automated deployments
- ✅ User satisfaction from pilots

## Support & Maintenance

**Ongoing maintenance:**
- Monitor Firebase usage (dashboard)
- Review error logs (Cloud Functions)
- Update dependencies monthly
- Backup Firestore data weekly

**Estimated time: 2-4 hours/month**