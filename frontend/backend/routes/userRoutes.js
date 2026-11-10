
const express = require("express");

const {
    createAgent,
    getAgents,
    updateAgentStatus
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// All routes require authentication and Admin access
router.use(protect, adminOnly);

router.post("/agents", createAgent);
router.get("/agents", getAgents);
router.patch("/agents/:id/status", updateAgentStatus);

module.exports = router;
