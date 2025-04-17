require('dotenv').config();

module.exports = {
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rental-auth'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    },
    oauth: {
        google: {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL
        },
        facebook: {
            clientID: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            callbackURL: process.env.FACEBOOK_CALLBACK_URL
        }
    },
    email: {
        service: process.env.EMAIL_SERVICE || 'gmail',
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
};