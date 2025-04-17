require('dotenv').config();

module.exports = {
    services: {
        auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:4001',
        rental: process.env.RENTAL_SERVICE_URL || 'http://rental-service:4002',
        service: process.env.SERVICE_SERVICE_URL || 'http://service-service:4003',
        payment: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:4004',
        messaging: process.env.MESSAGING_SERVICE_URL || 'http://messaging-service:4005',
        notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4006',
        admin: process.env.ADMIN_SERVICE_URL || 'http://admin-service:4007',
        search: process.env.SEARCH_SERVICE_URL || 'http://search-service:4008'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    }
};