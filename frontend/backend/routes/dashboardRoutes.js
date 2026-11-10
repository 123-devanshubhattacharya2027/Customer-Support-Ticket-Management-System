
const express = require("express");
const router = express.Router();

const {
    getDashboardStats
} = require("../controllers/dashboardController");

const protect = require("../middleware/authMiddleware");

// Dashboard statistics require authentication.
router.get("/", protect, getDashboardStats);

module.exports = router;
