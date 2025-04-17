const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['apartment', 'car', 'boat', 'equipment', 'other']
    },
    description: {
        type: String,
        required: true
    },
    price: {
        amount: {
            type: Number,
            required: true
        },
        period: {
            type: String,
            enum: ['hour', 'day', 'week', 'month'],
            default: 'day'
        }
    },
    location: {
        address: String,
        city: {
            type: String,
            required: true
        },
        state: String,
        zipCode: String,
        country: {
            type: String,
            required: true
        },
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    features: [String],
    specifications: {
        // For apartments
        bedrooms: Number,
        bathrooms: Number,
        area: Number,

        // For cars
        make: String,
        model: String,
        year: Number,
        mileage: Number,

        // For boats
        boatType: String,
        length: Number,
        capacity: Number,

        // Common
        additionalSpecs: mongoose.Schema.Types.Mixed
    },
    images: [{
        url: String,
        caption: String
    }],
    availability: {
        startDate: Date,
        endDate: Date,
        unavailableDates: [Date],
        instantBooking: {
            type: Boolean,
            default: true
        }
    },
    rules: [String],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'inactive'],
        default: 'pending'
    },
    ratings: {
        average: {
            type: Number,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    },
    reviewsCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for search
rentalSchema.index({
    title: 'text',
    description: 'text',
    'location.city': 'text',
    'location.country': 'text'
});

// Index for geospatial queries if coordinates are provided
rentalSchema.index({
    'location.coordinates': '2dsphere'
});

module.exports = mongoose.model('Rental', rentalSchema);