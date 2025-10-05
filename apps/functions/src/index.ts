/**
 * Cloud Functions for Tech Log
 *
 * This is the main entry point for all Cloud Functions.
 * Export all functions from this file.
 */

// Export scheduled functions
export * from './scheduled/cleanup.js';

// Export trigger functions
export * from './triggers/onSubmissionCreate.js';
