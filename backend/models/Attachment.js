
const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
    {
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true
        },

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        originalName: {
            type: String,
            required: true,
            trim: true
        },

        filename: {
            type: String,
            required: true,
            unique: true
        },

        mimeType: {
            type: String,
            required: true
        },

        size: {
            type: Number,
            required: true,
            min: 1,
            max: 5 * 1024 * 1024
        }
    },
    {
        timestamps: true
    }
);

// Quickly find attachments belonging to a ticket
attachmentSchema.index({ ticket: 1, createdAt: -1 });

module.exports = mongoose.model("Attachment", attachmentSchema);
