
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./config/db");

const ticketRoutes = require("./routes/ticketRoutes");
const replyRoutes = require("./routes/replyRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
// Import Error Middleware
const {
    notFound,
    errorHandler
} = require("./middleware/errorMiddleware");

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// =====================================
// GLOBAL MIDDLEWARE
// =====================================

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// =====================================
// API ROUTES
// =====================================

app.use("/api/tickets", ticketRoutes);
app.use("/api/replies", replyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// =====================================
// TEST API
// =====================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to SupportDesk API"
    });
});

// =====================================
// ERROR HANDLING MIDDLEWARE
// IMPORTANT: Keep these after all routes
// =====================================

// Handle undefined routes (404)
app.use(notFound);

// Handle all application errors
app.use(errorHandler);

// =====================================
// SERVER CONFIGURATION
// =====================================

const PORT = process.env.PORT || 5000;

// =====================================
// START SERVER AFTER DB CONNECTION
// =====================================

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(
                `Server running at http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error(
            "Server startup failed:",
            error.message
        );

        process.exit(1);
    }
};

startServer();

