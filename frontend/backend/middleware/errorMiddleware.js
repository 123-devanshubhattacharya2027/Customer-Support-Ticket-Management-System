
// Handle routes that do not exist
const notFound = (req, res, next) => {
    const error = new Error(
        `Route not found: ${req.originalUrl}`
    );

    res.status(404);
    next(error);
};

// Centralized error handler
const errorHandler = (err, req, res, next) => {
    // Use existing status code or default to 500
    const statusCode =
        res.statusCode && res.statusCode !== 200
            ? res.statusCode
            : 500;

    console.error("Error:", err.message);

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        stack:
            process.env.NODE_ENV === "production"
                ? undefined
                : err.stack
    });
};

module.exports = {
    notFound,
    errorHandler
};
