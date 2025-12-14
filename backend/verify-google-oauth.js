// Quick verification script to check Google OAuth configuration
require('dotenv').config();

console.log('=== Google OAuth Configuration Check ===\n');

const clientId = process.env.GOOGLE_CLIENT_ID;

if (clientId) {
  console.log('✅ GOOGLE_CLIENT_ID is SET');
  console.log(`   Value: ${clientId.substring(0, 30)}...`);
  console.log(`   Full length: ${clientId.length} characters`);
  
  // Verify it looks like a valid Google Client ID
  if (clientId.includes('.apps.googleusercontent.com')) {
    console.log('✅ Format looks correct (contains .apps.googleusercontent.com)');
  } else {
    console.log('⚠️  Warning: Format might be incorrect');
  }
  
  // Try to initialize the OAuth client
  try {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(clientId);
    console.log('✅ OAuth2Client initialized successfully');
    console.log('\n✅ All checks passed! Google OAuth should work.');
    console.log('\n⚠️  Remember: The server must be restarted for this to take effect!');
  } catch (err) {
    console.error('❌ Failed to initialize OAuth2Client:', err.message);
    process.exit(1);
  }
} else {
  console.error('❌ GOOGLE_CLIENT_ID is NOT SET');
  console.error('   Please create a .env file with:');
  console.error('   GOOGLE_CLIENT_ID=your_client_id_here');
  process.exit(1);
}

console.log('\n=== Configuration Check Complete ===');

