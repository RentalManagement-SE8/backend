require('dotenv').config();

module.exports = {
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rental-rentals'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret'
    },
    cloudinary: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    },
    services: {
        notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4006'
    }
};