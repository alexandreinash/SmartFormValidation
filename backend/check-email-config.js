#!/usr/bin/env node

/**
 * Email Configuration Checker
 * 
 * This script checks if your email configuration is set up correctly
 * for password reset functionality.
 */

require('dotenv').config();

console.log('\n========================================');
console.log('Email Configuration Checker');
console.log('========================================\n');

let hasErrors = false;

// Check EMAIL_ENABLED
console.log('1. Checking EMAIL_ENABLED...');
if (process.env.EMAIL_ENABLED === 'true') {
  console.log('   ✅ EMAIL_ENABLED=true');
} else {
  console.log('   ❌ EMAIL_ENABLED is not set to "true"');
  console.log('   Fix: Set EMAIL_ENABLED=true in your .env file');
  hasErrors = true;
}

// Check EMAIL_PROVIDER
console.log('\n2. Checking EMAIL_PROVIDER...');
const provider = process.env.EMAIL_PROVIDER || 'smtp';
console.log(`   Provider: ${provider}`);

// Check SMTP configuration
if (provider === 'smtp') {
  console.log('\n3. Checking SMTP Configuration...');
  
  if (process.env.SMTP_HOST) {
    console.log(`   ✅ SMTP_HOST=${process.env.SMTP_HOST}`);
  } else {
    console.log('   ⚠️  SMTP_HOST not set (using default: smtp.gmail.com)');
  }
  
  if (process.env.SMTP_PORT) {
    console.log(`   ✅ SMTP_PORT=${process.env.SMTP_PORT}`);
  } else {
    console.log('   ⚠️  SMTP_PORT not set (using default: 587)');
  }
  
  if (process.env.SMTP_USER) {
    console.log(`   ✅ SMTP_USER=${process.env.SMTP_USER}`);
  } else {
    console.log('   ❌ SMTP_USER is not set');
    console.log('   Fix: Set SMTP_USER=your-email@gmail.com in your .env file');
    hasErrors = true;
  }
  
  if (process.env.SMTP_PASS) {
    const passLength = process.env.SMTP_PASS.length;
    console.log(`   ✅ SMTP_PASS is set (${passLength} characters)`);
    if (passLength !== 16) {
      console.log('   ⚠️  Warning: Gmail App Passwords are usually 16 characters');
      console.log('   Make sure you\'re using an App Password, not your regular password');
    }
  } else {
    console.log('   ❌ SMTP_PASS is not set');
    console.log('   Fix: Set SMTP_PASS=your-app-password in your .env file');
    console.log('   For Gmail: Get an App Password at https://myaccount.google.com/apppasswords');
    hasErrors = true;
  }
}

// Check FRONTEND_URL
console.log('\n4. Checking FRONTEND_URL...');
if (process.env.FRONTEND_URL) {
  console.log(`   ✅ FRONTEND_URL=${process.env.FRONTEND_URL}`);
} else {
  console.log('   ⚠️  FRONTEND_URL not set (using default: http://localhost:5174)');
}

// Summary
console.log('\n========================================');
if (hasErrors) {
  console.log('❌ Configuration has errors');
  console.log('\nNext steps:');
  console.log('1. Open backend/.env file');
  console.log('2. Set EMAIL_ENABLED=true');
  console.log('3. Set SMTP_USER=your-email@gmail.com');
  console.log('4. Set SMTP_PASS=your-16-character-app-password');
  console.log('\nFor Gmail App Password:');
  console.log('  1. Enable 2-Step Verification: https://myaccount.google.com/security');
  console.log('  2. Generate App Password: https://myaccount.google.com/apppasswords');
  console.log('  3. Copy the 16-character password (remove spaces)');
  console.log('  4. Add to .env file');
  console.log('\nAfter updating .env, restart your backend server.');
} else {
  console.log('✅ Configuration looks good!');
  console.log('\nTo test email sending:');
  console.log('1. Start your backend server');
  console.log('2. Login as admin');
  console.log('3. Send POST request to /api/auth/test-email');
  console.log('   (or use the test endpoint in your admin dashboard)');
}
console.log('========================================\n');

process.exit(hasErrors ? 1 : 0);

