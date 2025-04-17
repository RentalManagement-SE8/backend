const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: function() {
            // Password is required unless user is registered via OAuth
            return !this.oauthProvider;
        }
    },
    role: {
        type: String,
        enum: ['customer', 'owner', 'admin'],
        default: 'customer'
    },
    oauthProvider: {
        type: String,
        enum: ['google', 'facebook', null],
        default: null
    },
    oauthId: String,
    securityQuestions: [{
        question: String,
        answer: String
    }],
    passwordResetToken: String,
    passwordResetExpires: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: Date,
    isActive: {
        type: Boolean,
        default: true
    },
    profileImage: String,
    phoneNumber: String,
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        // Generate salt
        const salt = await bcrypt.genSalt(10);
        // Hash password
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);