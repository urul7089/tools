const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const rateLimit = require('express-rate-limit');

// Environment variables (should be in .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '30m'; // 30 minutes
const SALT_ROUNDS = 10;

// Rate limiting for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { error: 'Too many login attempts. Please try again later.' }
});

// Mock admin user (should be in database)
const adminUser = {
    email: 'admin@example.com',
    // Password: Admin123!
    passwordHash: '$2b$10$YourHashedPasswordHere',
    twoFactorSecret: 'your2FAsecretkey'
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

// Login endpoint
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Check if user exists (mock check)
        if (email !== adminUser.email) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, adminUser.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Generate temporary token for 2FA
        const tempToken = jwt.sign(
            { email, temp: true },
            JWT_SECRET,
            { expiresIn: '5m' }
        );

        // Return success with requirement for 2FA
        res.json({
            requireTwoFactor: true,
            tempToken
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'An error occurred during login.' });
    }
});

// Verify 2FA code
router.post('/verify-2fa', async (req, res) => {
    try {
        const { code } = req.body;
        const tempToken = req.headers.authorization?.split(' ')[1];

        if (!code || !tempToken) {
            return res.status(400).json({ error: 'Code and token are required.' });
        }

        // Verify temporary token
        const decoded = jwt.verify(tempToken, JWT_SECRET);
        if (!decoded.temp) {
            return res.status(401).json({ error: 'Invalid token.' });
        }

        // Verify 2FA code
        const verified = speakeasy.totp.verify({
            secret: adminUser.twoFactorSecret,
            encoding: 'base32',
            token: code
        });

        if (!verified) {
            return res.status(401).json({ error: 'Invalid verification code.' });
        }

        // Generate final access token
        const accessToken = jwt.sign(
            { email: decoded.email, admin: true },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        res.json({
            accessToken,
            expiresIn: JWT_EXPIRY
        });

    } catch (error) {
        console.error('2FA verification error:', error);
        res.status(500).json({ error: 'An error occurred during verification.' });
    }
});

// Refresh token endpoint
router.post('/refresh', verifyToken, (req, res) => {
    try {
        const newToken = jwt.sign(
            { email: req.user.email, admin: true },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        res.json({
            accessToken: newToken,
            expiresIn: JWT_EXPIRY
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'An error occurred while refreshing token.' });
    }
});

// Logout endpoint
router.post('/logout', verifyToken, (req, res) => {
    // In a real implementation, you might want to blacklist the token
    res.json({ message: 'Logged out successfully.' });
});

// Check auth status endpoint
router.get('/status', verifyToken, (req, res) => {
    res.json({
        authenticated: true,
        user: {
            email: req.user.email,
            admin: req.user.admin
        }
    });
});

// Middleware to protect analytics routes
router.use('/analytics/*', verifyToken, (req, res, next) => {
    if (!req.user.admin) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
});

module.exports = {
    router,
    verifyToken
}; 