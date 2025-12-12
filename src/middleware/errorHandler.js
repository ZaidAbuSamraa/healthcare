const logger = require('../utils/logger');

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Send response
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// Not found handler
const notFound = (req, res) => {
    logger.warn(`404 - Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
};

// Async wrapper to catch errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, notFound, asyncHandler };
