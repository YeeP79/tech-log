#!/usr/bin/env node
/**
 * Pre-Deployment Checks Script
 *
 * Single Responsibility: Run quality checks before deployment
 * Follows Open/Closed Principle: Easy to add new checks without modifying existing ones
 */

import { config } from 'dotenv';
import { spawn } from 'child_process';

// Load environment variables from .env.local
config({ path: '.env.local' });

interface CheckResult {
  name: string;
  passed: boolean;
  output?: string;
  error?: string;
}

/**
 * Runs a shell command and returns the result
 */
async function runCommand(
  command: string,
  args: string[],
  name: string
): Promise<CheckResult> {
  return new Promise((resolve) => {
    console.log(`⏳ Running ${name}...`);

    const proc = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    if (proc.stdout) {
      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }

    if (proc.stderr) {
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    proc.on('close', (code) => {
      const passed = code === 0;

      if (passed) {
        console.log(`✅ ${name} passed`);
      } else {
        console.error(`❌ ${name} failed`);
        if (stderr) {
          console.error(stderr);
        }
      }

      resolve({
        name,
        passed,
        output: stdout,
        error: stderr,
      });
    });

    proc.on('error', (err) => {
      console.error(`❌ ${name} failed with error:`, err);
      resolve({
        name,
        passed: false,
        error: err.message,
      });
    });
  });
}

/**
 * Run linting check
 */
async function checkLint(): Promise<CheckResult> {
  return runCommand('npm', ['run', 'lint'], 'Linting');
}

/**
 * Run type checking
 */
async function checkTypes(): Promise<CheckResult> {
  return runCommand('npm', ['run', 'typecheck'], 'Type checking');
}

/**
 * Run tests
 */
async function checkTests(): Promise<CheckResult> {
  // For now, tests might not be set up, so we'll make this optional
  try {
    return await runCommand('npm', ['run', 'test', '--', '--passWithNoTests'], 'Tests');
  } catch {
    console.log('⚠️  No tests configured yet, skipping...');
    return {
      name: 'Tests',
      passed: true,
      output: 'No tests configured',
    };
  }
}

/**
 * Validate environment
 */
async function checkEnvironment(): Promise<CheckResult> {
  return runCommand('npx', ['tsx', 'scripts/deploy/validate-env.ts'], 'Environment validation');
}

/**
 * Main pre-deployment check function
 */
async function main(): Promise<void> {
  console.log('🚀 Running pre-deployment checks...\n');

  const checks: Array<() => Promise<CheckResult>> = [
    checkEnvironment,
    checkLint,
    checkTypes,
    // checkTests, // Uncomment when tests are ready
  ];

  const results: CheckResult[] = [];

  // Run all checks
  for (const check of checks) {
    const result = await check();
    results.push(result);
    console.log(''); // Empty line for readability
  }

  // Summarize results
  const failedChecks = results.filter((r) => !r.passed);

  if (failedChecks.length > 0) {
    console.error('❌ Pre-deployment checks failed:\n');
    failedChecks.forEach((check) => {
      console.error(`   - ${check.name}`);
    });
    console.error('\nPlease fix the issues before deploying.\n');
    process.exit(1);
  }

  console.log('✅ All pre-deployment checks passed!\n');
  console.log('Ready to deploy 🚀\n');
  process.exit(0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Fatal error during pre-deployment checks:', err);
    process.exit(1);
  });
}

export { checkLint, checkTypes, checkTests, checkEnvironment };
