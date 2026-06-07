const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // Support both Authorization: Bearer <token> and x-auth-token
    let token = req.header('x-auth-token');
    const authHeader = req.header('Authorization');
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Server misconfiguration: JWT secret missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user || decoded; // Handle both { user: {...} } and flat payloads
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admin only' });
    }
};

module.exports = { auth, adminOnly };
