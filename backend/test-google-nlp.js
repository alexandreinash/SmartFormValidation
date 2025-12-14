require('dotenv').config();
const { analyzeSentiment, analyzeEntities } = require('./src/services/googleNlp');

async function testGoogleNLP() {
  console.log('🧪 Testing Google Cloud Natural Language API...\n');
  
  console.log('Environment check:');
  console.log('  GCLOUD_NLP_ENABLED:', process.env.GCLOUD_NLP_ENABLED);
  console.log('  GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
  console.log('');
  
  if (process.env.GCLOUD_NLP_ENABLED !== 'true') {
    console.log('❌ GCLOUD_NLP_ENABLED is not set to "true"');
    return;
  }
  
  const testText = "I hate this product! It's terrible and awful!";
  console.log('Test text:', testText);
  console.log('');
  
  try {
    console.log('Testing sentiment analysis...');
    const sentiment = await analyzeSentiment(testText);
    console.log('✅ Sentiment result:', sentiment);
    console.log('  Score:', sentiment.score, '(negative if < 0)');
    console.log('  Magnitude:', sentiment.magnitude);
    console.log('');
    
    console.log('Testing entity recognition...');
    const entities = await analyzeEntities(testText);
    console.log('✅ Entity result:', entities);
    console.log('  Entities found:', entities.entities.length);
    console.log('');
    
    console.log('🎉 Google NLP API is working correctly!');
  } catch (error) {
    console.error('❌ Error testing Google NLP API:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    console.error('  Details:', error.details);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  1. Check if GOOGLE_APPLICATION_CREDENTIALS path is correct');
    console.error('  2. Verify the service account JSON file exists');
    console.error('  3. Make sure Natural Language API is enabled in Google Cloud Console');
    console.error('  4. Check if the service account has proper permissions');
  }
}

testGoogleNLP();

