const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to check if user is authenticated
exports.isAuth = async(req, res, next) => {
    try {
        const token = req.header('Authorization') ? req.header('Authorization').replace('Bearer ', '') : null;

        if (!token) {
            return res.status(401).json({ message: 'Authentication required. Please login.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token. Please login again.' });
    }
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
};