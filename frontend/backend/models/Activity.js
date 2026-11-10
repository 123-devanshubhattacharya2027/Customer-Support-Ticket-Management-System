
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
    {
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true
        },

        action: {
            type: String,
            enum: [
                "Created",
                "Assigned",
                "Status Changed",
                "Priority Changed",
                "Public Reply",
                "Internal Note"
            ],
            required: true
        },

        oldValue: {
            type: String,
            default: null
        },

        newValue: {
            type: String,
            default: null
        },

        author: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// Retrieve ticket history chronologically
activitySchema.index({ ticket: 1, createdAt: 1 });

module.exports = mongoose.model("Activity", activitySchema);
