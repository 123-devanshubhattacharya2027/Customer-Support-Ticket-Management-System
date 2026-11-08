const express = require("express");

const router = express.Router();

const {
    addReply,
    getReplies,
    getActivities
} = require("../controllers/replyController");

const protect = require("../middleware/authMiddleware");

// Protect every reply and activity endpoint.
router.use(protect);

// Add public reply or internal note.
router.post("/:ticketId", addReply);

// Get ticket activity history.
router.get("/:ticketId/activities", getActivities);

// Get replies and notes.
router.get("/:ticketId", getReplies);

module.exports = router;