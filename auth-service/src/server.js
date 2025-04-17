const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const config = require('./config');

const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(config.mongodb.uri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
    console.log(`Auth Service running on port ${PORT}`);
});