#!/usr/bin/env tsx
/**
 * Health Check Script
 * Validates all critical system connections:
 * - Database (Prisma)
 * - Gemini API
 * - Pollinations AI
 * - Environment variables
 *
 * Run: npm run health
 */

import { prisma } from '@/lib/prisma';
import { generatePrompt } from '@/lib/services/promptGenerator';
import { generateImage } from '@/lib/services/imageGenerator';
import { env } from '@/lib/env';

// ─── Utilities ────────────────────────────────────────────────────────────────

function logSuccess(service: string, message: string) {
  console.log(`✅ ${service}: ${message}`);
}

function logError(service: string, error: unknown) {
  console.error(`❌ ${service}: ${error instanceof Error ? error.message : String(error)}`);
}

function logInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

// ─── Health Checks ────────────────────────────────────────────────────────────

async function checkEnvironment() {
  logInfo('Checking environment variables...');
  
  try {
    const required = [
      'DATABASE_URL',
      'API_SECRET_KEY',
      'GEMINI_API_KEY',
    ];

    const missing: string[] = [];
    
    // Access env to trigger validation
    const checks = {
      DATABASE_URL: env.DATABASE_URL,
      API_SECRET_KEY: env.API_SECRET_KEY,
      GEMINI_API_KEY: env.GEMINI_API_KEY,
      APP_URL: env.APP_URL,
      APP_NAME: env.APP_NAME,
      NODE_ENV: env.NODE_ENV,
    };

    logSuccess('Environment', 'All required variables present');
    logInfo(`  → NODE_ENV: ${checks.NODE_ENV}`);
    logInfo(`  → APP_NAME: ${checks.APP_NAME}`);
    logInfo(`  → APP_URL: ${checks.APP_URL}`);
    return true;
  } catch (error) {
    logError('Environment', error);
    return false;
  }
}

async function checkDatabase() {
  logInfo('Checking database connection...');
  
  try {
    await prisma.$connect();
    
    // Run a simple query to verify full connectivity
    const jobCount = await prisma.job.count();
    
    logSuccess('Database', `Connected to PostgreSQL (${jobCount} jobs in database)`);
    return true;
  } catch (error) {
    logError('Database', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function checkGemini() {
  logInfo('Checking Gemini API connection...');
  
  try {
    const result = await generatePrompt({
      productName: 'Test Product',
      description: 'A simple test to verify API connectivity',
    });

    if (result.usedFallback) {
      throw new Error('Gemini unavailable — fallback was used');
    }

    if (!result.prompt || result.prompt.length === 0) {
      throw new Error('Received empty response from Gemini');
    }
    
    logSuccess('Gemini API', `Connected and responding (${result.prompt.length} chars generated)`);
    return true;
  } catch (error) {
    logError('Gemini API', error);
    return false;
  }
}

async function checkPollinations() {
  logInfo('Checking Pollinations AI...');
  
  try {
    const testImage = await generateImage({
      prompt: 'simple health check test image',
    });
    
    if (!testImage || testImage.includes('placehold.co')) {
      throw new Error('Received placeholder instead of generated image');
    }
    
    logSuccess('Pollinations AI', `Connected and responding`);
    logInfo(`  → Test image: ${testImage.substring(0, 80)}...`);
    return true;
  } catch (error) {
    logError('Pollinations AI', error);
    return false;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏥 Running Glitrai Health Check...\n');
  console.log('═'.repeat(60));
  console.log('\n');

  const results = {
    environment: await checkEnvironment(),
    database: false,
    gemini: false,
    pollinations: false,
  };

  console.log('\n');

  // Only proceed with service checks if environment is valid
  if (results.environment) {
    results.database = await checkDatabase();
    console.log('\n');
    
    results.gemini = await checkGemini();
    console.log('\n');
    
    results.pollinations = await checkPollinations();
    console.log('\n');
  }

  console.log('═'.repeat(60));
  console.log('\n📊 Summary:\n');

  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(Boolean).length;

  console.log(`   Passed: ${passed}/${total}`);
  console.log(`   Failed: ${total - passed}/${total}`);
  console.log('\n');

  if (passed === total) {
    console.log('✨ All systems operational!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some systems need attention.\n');
    process.exit(1);
  }
}

// ─── Execute ──────────────────────────────────────────────────────────────────

main().catch((error) => {
  console.error('\n💥 Health check crashed:', error);
  process.exit(1);
});
