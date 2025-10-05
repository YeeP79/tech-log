#!/usr/bin/env node
/**
 * Environment Validation Script
 *
 * Single Responsibility: Validate environment variables and Firebase configuration
 * Follows Dependency Inversion Principle: Depends on abstractions (env vars), not concretions
 */

import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

interface EnvironmentConfig {
  firebaseProjectId: string;
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  allowedDomain?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates required environment variables
 */
function validateEnvironmentVariables(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required for deployment
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    errors.push('FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID is required');
  }

  if (projectId === 'YOUR_FIREBASE_PROJECT_ID') {
    errors.push('FIREBASE_PROJECT_ID is still set to placeholder value. Update .firebaserc with your actual project ID');
  }

  // Optional but recommended for production
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    warnings.push('NEXT_PUBLIC_FIREBASE_API_KEY not set - required for client-side Firebase');
  }

  if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
    warnings.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN not set - required for authentication');
  }

  if (!process.env.NEXT_PUBLIC_ALLOWED_DOMAIN) {
    warnings.push('NEXT_PUBLIC_ALLOWED_DOMAIN not set - domain restriction will not work');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates Firebase configuration file
 */
async function validateFirebaseConfig(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    const projectRoot = process.cwd();
    const firebaseRcPath = path.join(projectRoot, '.firebaserc');

    // Check if .firebaserc exists
    try {
      const firebaseRc = await fs.readFile(firebaseRcPath, 'utf-8');
      const config = JSON.parse(firebaseRc);

      if (!config.projects || Object.keys(config.projects).length === 0) {
        errors.push('.firebaserc is missing projects configuration');
      } else {
        // Check if any project has placeholder value
        const hasPlaceholder = Object.values(config.projects).some(
          (id) => id === 'YOUR_FIREBASE_PROJECT_ID'
        );
        if (hasPlaceholder) {
          errors.push('.firebaserc still has placeholder project ID. Run setup instructions to configure.');
        }
      }
    } catch (err) {
      errors.push(`.firebaserc file not found or invalid: ${err}`);
    }

    // Check if firebase.json exists
    const firebaseJsonPath = path.join(projectRoot, 'firebase.json');
    try {
      await fs.access(firebaseJsonPath);
    } catch {
      errors.push('firebase.json not found in project root');
    }

  } catch (err) {
    errors.push(`Failed to validate Firebase configuration: ${err}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Main validation function
 */
async function main(): Promise<void> {
  console.log('🔍 Validating deployment environment...\n');

  const envResult = validateEnvironmentVariables();
  const configResult = await validateFirebaseConfig();

  // Display results
  if (envResult.errors.length > 0) {
    console.error('❌ Environment Variable Errors:');
    envResult.errors.forEach(err => console.error(`   - ${err}`));
    console.log('');
  }

  if (configResult.errors.length > 0) {
    console.error('❌ Firebase Configuration Errors:');
    configResult.errors.forEach(err => console.error(`   - ${err}`));
    console.log('');
  }

  const allWarnings = [...envResult.warnings, ...configResult.warnings];
  if (allWarnings.length > 0) {
    console.warn('⚠️  Warnings:');
    allWarnings.forEach(warn => console.warn(`   - ${warn}`));
    console.log('');
  }

  // Exit with appropriate code
  if (!envResult.valid || !configResult.valid) {
    console.error('❌ Validation failed. Please fix errors before deploying.\n');
    process.exit(1);
  }

  console.log('✅ Environment validation passed!\n');
  process.exit(0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Fatal error during validation:', err);
    process.exit(1);
  });
}

export { validateEnvironmentVariables, validateFirebaseConfig };
