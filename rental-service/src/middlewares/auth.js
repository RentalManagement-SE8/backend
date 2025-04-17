const jwt = require('jsonwebtoken');
const config = require('../config');

exports.authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        req.userData = decoded;

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Authentication failed' });
    }
};