let client = null;

// Lazily require Google NLP client only when AI is enabled to avoid module issues
function getClient() {
  if (!client) {
    // Uses Google Cloud credentials from GOOGLE_APPLICATION_CREDENTIALS env var.
    // eslint-disable-next-line global-require
    const { LanguageServiceClient } = require('@google-cloud/language');
    client = new LanguageServiceClient();
  }
  return client;
}

async function analyzeSentiment(text) {
  if (process.env.GCLOUD_NLP_ENABLED !== 'true') {
    // AI disabled: behave like a no-op
    return { score: 0.0, magnitude: 0.0 };
  }

  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  const [result] = await getClient().analyzeSentiment({ document });
  const sentiment = result.documentSentiment || { score: 0.0, magnitude: 0.0 };

  return {
    score: sentiment.score,
    magnitude: sentiment.magnitude,
  };
}

async function analyzeEntities(text) {
  if (process.env.GCLOUD_NLP_ENABLED !== 'true') {
    return { entities: [] };
  }

  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  const [result] = await getClient().analyzeEntities({ document });

  return {
    entities: (result.entities || []).map((e) => ({
      name: e.name,
      type: e.type,
      salience: e.salience,
    })),
  };
}

module.exports = { analyzeSentiment, analyzeEntities };


