
const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./config/db");
const initializeSocket = require("./socket/socket");

const ticketRoutes = require("./routes/ticketRoutes");
const replyRoutes = require("./routes/replyRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const {
    notFound,
    errorHandler
} = require("./middleware/errorMiddleware");

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Create HTTP server
const server = http.createServer(app);

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
app.use(
    "/api/attachments",
    require("./routes/attachmentRoutes")
);
app.use("/api/notifications", notificationRoutes);

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
// ERROR HANDLING
// =====================================

app.use(notFound);
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

        // Initialize Socket.IO
        const io = initializeSocket(server);

        // Make Socket.IO available to controllers
        app.set("io", io);

        server.listen(PORT, () => {
            console.log(
                `Server running at http://localhost:${PORT}`
            );

            console.log("Socket.IO initialized successfully");
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
