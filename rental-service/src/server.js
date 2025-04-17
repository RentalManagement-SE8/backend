const express = require('express');
const mongoose = require('mongoose');
const rentalRoutes = require('./routes/rentalRoutes');
const config = require('./config');

const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(config.mongodb.uri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/', rentalRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
    console.log(`Rental Service running on port ${PORT}`);
});