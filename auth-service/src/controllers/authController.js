const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');
const speakeasy = require('speakeasy');
const emailService = require('../services/emailService');
const { validateRegistration, validateLogin } = require('../utils/validators');

exports.register = async (req, res) => {
    try {
        // Validate request body
        const { error } = validateRegistration(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { email, password, role, firstName, lastName } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate unique username
        const username = `user_${uuidv4().substring(0, 8)}`;

        // Create new user
        const user = new User({
            username,
            email,
            password,
            role,
            firstName,
            lastName
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.login = async (req, res) => {
    try {
        // Validate request body
        const { error } = validateLogin(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is using OAuth
        if (user.oauthProvider) {
            return res.status(400).json({
                message: `This account uses ${user.oauthProvider} authentication`
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate OTP
        const secret = speakeasy.generateSecret({ length: 20 });
        const otp = speakeasy.totp({
            secret: secret.base32,
            encoding: 'base32',
            step: 300 // 5 minutes
        });

        // Save reset token and expiry
        user.passwordResetToken = secret.base32;
        user.passwordResetExpires = Date.now() + 300000; // 5 minutes
        await user.save();

        // Send email with OTP
        await emailService.sendPasswordResetEmail(user.email, otp);

        res.status(200).json({
            message: 'Password reset OTP sent to your email',
            email: user.email
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Find user by email and token
        const user = await User.findOne({
            email,
            passwordResetToken: { $exists: true },
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Verify OTP
        const isValidOTP = speakeasy.totp.verify({
            secret: user.passwordResetToken,
            encoding: 'base32',
            token: otp,
            step: 300,
            window: 1
        });

        if (!isValidOTP) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Update password
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.userData.userId;

        // Find user by ID
        const user = await User.findById(userId).select('-password -passwordResetToken -passwordResetExpires');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.userData.userId;
        const updates = req.body;

        // Prevent updating critical fields
        delete updates.password;
        delete updates.email;
        delete updates.role;

        // Find and update user
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password -passwordResetToken -passwordResetExpires');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};