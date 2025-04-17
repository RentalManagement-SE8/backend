const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { authMiddleware } = require('./middlewares/auth');
const { rateLimit } = require('./middlewares/rateLimit');
const config = require('./config');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Rate limiting
app.use(rateLimit);

// Routes that don't require authentication
app.use('/api/auth', createProxyMiddleware({
    target: config.services.auth,
    changeOrigin: true,
    pathRewrite: {
        '^/api/auth': '/',
    },
}));

// Routes that require authentication
app.use('/api/rentals', authMiddleware, createProxyMiddleware({
    target: config.services.rental,
    changeOrigin: true,
    pathRewrite: {
        '^/api/rentals': '/',
    },
}));

app.use('/api/services', authMiddleware, createProxyMiddleware({
    target: config.services.service,
    changeOrigin: true,
    pathRewrite: {
        '^/api/services': '/',
    },
}));

app.use('/api/payments', authMiddleware, createProxyMiddleware({
    target: config.services.payment,
    changeOrigin: true,
    pathRewrite: {
        '^/api/payments': '/',
    },
}));

app.use('/api/messages', authMiddleware, createProxyMiddleware({
    target: config.services.messaging,
    changeOrigin: true,
    pathRewrite: {
        '^/api/messages': '/',
    },
}));

app.use('/api/admin', authMiddleware, createProxyMiddleware({
    target: config.services.admin,
    changeOrigin: true,
    pathRewrite: {
        '^/api/admin': '/',
    },
}));

app.use('/api/search', createProxyMiddleware({
    target: config.services.search,
    changeOrigin: true,
    pathRewrite: {
        '^/api/search': '/',
    },
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});