
const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    getNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} = require("../controllers/notificationController");

// All notification routes require authentication
router.use(protect);

// GET all notifications
router.get("/", getNotifications);

// GET unread notification count
router.get("/unread-count", getUnreadCount);

// MARK all notifications as read
router.patch("/read-all", markAllNotificationsAsRead);

// MARK one notification as read
router.patch("/:notificationId/read", markNotificationAsRead);

// DELETE one notification
router.delete("/:notificationId", deleteNotification);

module.exports = router;
