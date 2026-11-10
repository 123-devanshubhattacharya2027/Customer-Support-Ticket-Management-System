
const multer = require("multer");

// Handle routes that do not exist
const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

// Centralized error handler
const errorHandler = (err, req, res, next) => {
    console.error("Error:", err.message);

    let statusCode = err.statusCode || err.status || res.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Handle Multer upload errors
    if (err instanceof multer.MulterError) {
        statusCode = 400;

        if (err.code === "LIMIT_FILE_SIZE") {
            message = "File size exceeds the maximum allowed limit of 5 MB.";
        } else if (err.code === "LIMIT_FILE_COUNT") {
            message = "Maximum 5 files are allowed per upload.";
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
            message = "Unexpected file field. Use the field name 'attachments'.";
        } else {
            message = "File upload failed. Please check your selected files.";
        }
    }

    // Handle invalid file types and content
    else if (
        message.includes("Invalid file type") ||
        message.includes("File content does not match")
    ) {
        statusCode = 400;
    }

    // Avoid exposing internal errors
    if (statusCode >= 500) {
        message = "Internal Server Error";
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== "production" && statusCode >= 500
            ? { stack: err.stack }
            : {})
    });
};

module.exports = {
    notFound,
    errorHandler
};
