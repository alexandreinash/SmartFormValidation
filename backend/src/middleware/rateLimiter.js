const rateLimit = require('express-rate-limit');

// More lenient in development mode
const isProduction = process.env.NODE_ENV === 'production';
const disableRateLimit = process.env.DISABLE_RATE_LIMIT === 'true';

// Create a no-op middleware if rate limiting is disabled
const noOpLimiter = (req, res, next) => next();

// General API rate limiter
const apiLimiter = disableRateLimit ? noOpLimiter : rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (isProduction ? 100 : 10000), // 10000 in dev, 100 in production
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
});

// Rate limiter for form submissions
// More lenient in development mode for easier testing
const submissionMax = process.env.RATE_LIMIT_SUBMISSION_MAX 
  ? parseInt(process.env.RATE_LIMIT_SUBMISSION_MAX, 10)
  : (isProduction ? 10 : 5000); // 5000 in dev, 10 in production

const submissionLimiter = disableRateLimit ? noOpLimiter : rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_SUBMISSION_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes default
  max: submissionMax,
  message: {
    success: false,
    message: `Too many form submissions. Please wait before submitting again. (Limit: ${submissionMax} per 15 minutes)`,
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Rate limiter for authentication endpoints
// More lenient in development mode
const authMax = process.env.RATE_LIMIT_AUTH_MAX 
  ? parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10)
  : (isProduction ? 5 : 500); // 500 in dev, 5 in production

const authLimiter = disableRateLimit ? noOpLimiter : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: authMax,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Log rate limit settings on startup for debugging
if (disableRateLimit) {
  console.log(`[Rate Limiter] ⚠️  RATE LIMITING IS DISABLED (DISABLE_RATE_LIMIT=true)`);
} else if (!isProduction) {
  console.log(`[Rate Limiter] Development mode - Limits:`);
  console.log(`  - General API: 10000 requests per 15 minutes`);
  console.log(`  - Auth endpoints: ${authMax} requests per 15 minutes`);
  console.log(`  - Form submissions: ${submissionMax} requests per 15 minutes`);
  console.log(`  - To disable: Set DISABLE_RATE_LIMIT=true in .env`);
} else {
  console.log(`[Rate Limiter] Production mode - Limits:`);
  console.log(`  - General API: 100 requests per 15 minutes`);
  console.log(`  - Auth endpoints: ${authMax} requests per 15 minutes`);
  console.log(`  - Form submissions: ${submissionMax} requests per 15 minutes`);
}

module.exports = {
  apiLimiter,
  submissionLimiter,
  authLimiter,
};

