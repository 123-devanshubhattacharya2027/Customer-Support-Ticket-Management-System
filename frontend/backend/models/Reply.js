
const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
    {
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true
        },

        content: {
            type: String,
            required: [true, "Reply content is required"],
            trim: true
        },

        type: {
            type: String,
            enum: ["Public", "Internal"],
            required: true,
            default: "Public"
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

// Retrieve replies in chronological order
replySchema.index({ ticket: 1, createdAt: 1 });

module.exports = mongoose.model("Reply", replySchema);
