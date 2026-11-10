
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        // User who will receive this notification
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        // User who triggered the notification
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // Notification category
        type: {
            type: String,
            enum: [
                "TICKET_CREATED",
                "TICKET_ASSIGNED",
                "TICKET_STATUS_CHANGED",
                "NEW_REPLY"
            ],
            required: true
        },

        // Notification heading
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        // Notification description
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },

        // Related ticket
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            default: null,
            index: true
        },

        // Whether the notification has been read
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },

        // When the notification was read
        readAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Efficiently retrieve a user's notifications
notificationSchema.index({
    recipient: 1,
    createdAt: -1
});

// Efficiently retrieve unread notifications
notificationSchema.index({
    recipient: 1,
    isRead: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);
