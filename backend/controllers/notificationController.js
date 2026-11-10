
const mongoose = require("mongoose");
const Notification = require("../models/Notification");

// =====================================
// GET USER NOTIFICATIONS
// =====================================

const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const page = Math.max(
            1,
            parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            50,
            Math.max(1, parseInt(req.query.limit, 10) || 20)
        );

        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] =
            await Promise.all([
                Notification.find({ recipient: userId })
                    .populate("sender", "name email")
                    .populate("ticket", "subject status")
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),

                Notification.countDocuments({
                    recipient: userId
                }),

                Notification.countDocuments({
                    recipient: userId,
                    isRead: false
                })
            ]);

        return res.status(200).json({
            success: true,
            count: notifications.length,
            total,
            unreadCount,
            page,
            totalPages: Math.ceil(total / limit),
            notifications
        });

    } catch (error) {
        console.error("Get notifications error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch notifications."
        });
    }
};

// =====================================
// GET UNREAD NOTIFICATION COUNT
// =====================================

const getUnreadCount = async (req, res) => {
    try {
        const unreadCount = await Notification.countDocuments({
            recipient: req.user.id,
            isRead: false
        });

        return res.status(200).json({
            success: true,
            unreadCount
        });

    } catch (error) {
        console.error("Unread count error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch unread notification count."
        });
    }
};

// =====================================
// MARK ONE NOTIFICATION AS READ
// =====================================

const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID."
            });
        }

        const notification = await Notification.findOne({
            _id: notificationId,
            recipient: req.user.id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date();

            await notification.save();
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read.",
            notification
        });

    } catch (error) {
        console.error("Mark notification read error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to mark notification as read."
        });
    }
};

// =====================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================

const markAllNotificationsAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            {
                recipient: req.user.id,
                isRead: false
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date()
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read.",
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error("Mark all notifications read error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to mark all notifications as read."
        });
    }
};

// =====================================
// DELETE ONE NOTIFICATION
// =====================================

const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID."
            });
        }

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            recipient: req.user.id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully."
        });

    } catch (error) {
        console.error("Delete notification error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete notification."
        });
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
};
