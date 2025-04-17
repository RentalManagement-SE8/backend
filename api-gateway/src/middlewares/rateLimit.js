const rateLimit = require('express-rate-limit');

exports.rateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: 'Too many requests, please try again later.'
    }
});