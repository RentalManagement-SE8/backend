const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    rental: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rental',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    totalPrice: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'failed'],
        default: 'pending'
    },
    paymentId: String,
    specialRequests: String,
    cancellationReason: String,
    cancellationDate: Date,
    refundStatus: {
        type: String,
        enum: ['none', 'pending', 'processed', 'rejected'],
        default: 'none'
    },
    refundAmount: Number,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);