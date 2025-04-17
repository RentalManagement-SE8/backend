const nodemailer = require('nodemailer');
const config = require('../config');

// Create transporter
const transporter = nodemailer.createTransport({
    service: config.email.service,
    auth: {
        user: config.email.user,
        pass: config.email.pass
    }
});

// Send password reset email
exports.sendPasswordResetEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: config.email.user,
            to: email,
            subject: 'Password Reset OTP',
            html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset. Use the following OTP to reset your password:</p>
        <h2>${otp}</h2>
        <p>This OTP will expire in 5 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error('Failed to send email');
    }
};

// Send welcome email
exports.sendWelcomeEmail = async (email, username) => {
    try {
        const mailOptions = {
            from: config.email.user,
            to: email,
            subject: 'Welcome to Rental & Services Management System',
            html: `
        <h1>Welcome to our platform!</h1>
        <p>Hello ${username},</p>
        <p>Thank you for joining our Rental & Services Management System. We're thrilled to have you on board!</p>
        <p>If you have any questions, feel free to contact our support team.</p>
      `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error('Failed to send email');
    }
};