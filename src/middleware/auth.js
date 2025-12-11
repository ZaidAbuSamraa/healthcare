const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'healthpal-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'healthpal-refresh-secret';
const JWT_EXPIRES_IN = '1h';
const JWT_REFRESH_EXPIRES_IN = '7d';

// Generate tokens for a user
const generateTokens = (user) => {
    const payload = { id: user.id, username: user.username, role: user.role };
    return {
        accessToken: jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }),
        refreshToken: jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN }),
        expiresIn: JWT_EXPIRES_IN
    };
};

// Verify access token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch {
        return null;
    }
};

// Middleware: Require authentication
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    const decoded = verifyToken(authHeader.split(' ')[1]);
    if (!decoded) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
    
    req.user = decoded;
    next();
};

// Middleware: Optional authentication
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const decoded = verifyToken(authHeader.split(' ')[1]);
        if (decoded) req.user = decoded;
    }
    next();
};

// Middleware: Role-based authorization
const authorize = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
};

module.exports = {
    generateTokens,
    verifyToken,
    verifyRefreshToken,
    authenticate,
    optionalAuth,
    authorize
};
