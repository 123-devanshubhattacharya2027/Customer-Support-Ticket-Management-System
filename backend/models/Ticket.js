
const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
    {
        subject: {
            type: String,
            required: [true, "Subject is required"],
            trim: true,
            maxlength: 200
        },

        customerName: {
            type: String,
            trim: true,
            default: ""
        },

        customerEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: ""
        },

        // Account that created this ticket
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // Agent account assigned to this ticket
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true
        },

        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Urgent"],
            default: "Medium"
        },

        status: {
            type: String,
            enum: [
                "Open",
                "In Progress",
                "Waiting on Customer",
                "Resolved"
            ],
            default: "Open"
        },

        // Retained for compatibility with existing frontend
        assignee: {
            type: String,
            trim: true,
            default: "Unassigned"
        }
    },
    {
        timestamps: true
    }
);

// Validate customer information
ticketSchema.pre("validate", function () {
    if (!this.customerName && !this.customerEmail) {
        this.invalidate(
            "customerName",
            "Customer name or email is required"
        );
    }
});

// Existing overdue calculation
ticketSchema.virtual("isOverdue").get(function () {
    const twentyFourHours = 24 * 60 * 60 * 1000;

    return (
        this.status !== "Resolved" &&
        this.createdAt &&
        Date.now() - this.createdAt.getTime() > twentyFourHours
    );
});

// Include virtual fields in JSON
ticketSchema.set("toJSON", { virtuals: true });
ticketSchema.set("toObject", { virtuals: true });

// Database indexes
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ assignee: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ updatedAt: -1 });

ticketSchema.index({
    subject: "text",
    customerName: "text",
    customerEmail: "text"
});

module.exports = mongoose.model("Ticket", ticketSchema);

