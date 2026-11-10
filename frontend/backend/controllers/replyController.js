const mongoose = require("mongoose");

const Reply = require("../models/Reply");
const Ticket = require("../models/Ticket");
const Activity = require("../models/Activity");
const logActivity = require("../utils/activityLogger");

// =====================================
// CHECK TICKET ACCESS
// =====================================

const canAccessTicket = (user, ticket) => {
    if (!user || !ticket) return false;

    if (user.role === "Admin") {
        return true;
    }

    if (user.role === "Agent") {
        return (
            ticket.assignedTo &&
            ticket.assignedTo.toString() === user._id.toString()
        );
    }

    if (user.role === "Customer") {
        return (
            ticket.createdBy &&
            ticket.createdBy.toString() === user._id.toString()
        );
    }

    return false;
};

// =====================================
// GET AND VALIDATE TICKET
// =====================================

const getAuthorizedTicket = async (ticketId, user, res) => {
    if (!mongoose.isValidObjectId(ticketId)) {
        res.status(400).json({
            success: false,
            message: "Invalid ticket ID."
        });
        return null;
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
        res.status(404).json({
            success: false,
            message: "Ticket not found."
        });
        return null;
    }

    if (!canAccessTicket(user, ticket)) {
        res.status(403).json({
            success: false,
            message: "You are not allowed to access this ticket."
        });
        return null;
    }

    return ticket;
};

// =====================================
// ADD PUBLIC REPLY OR INTERNAL NOTE
// =====================================

const addReply = async (req, res) => {
    try {
        const { content, type } = req.body;
        const { ticketId } = req.params;
        const user = req.user;

        const ticket = await getAuthorizedTicket(
            ticketId,
            user,
            res
        );

        if (!ticket) return;

        if (
            typeof content !== "string" ||
            !content.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Reply content is required."
            });
        }

        if (type && !["Public", "Internal"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Type must be Public or Internal."
            });
        }

        // Customers can only submit public replies.
        if (user.role === "Customer" && type === "Internal") {
            return res.status(403).json({
                success: false,
                message: "Customers cannot create internal notes."
            });
        }

        // Only Admin, Agent and Customer roles are supported.
        if (!["Admin", "Agent", "Customer"].includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied."
            });
        }

        const replyType = type || "Public";

        // Never trust the author supplied by the frontend.
        const replyAuthor = user.name;

        const reply = await Reply.create({
            ticket: ticket._id,
            content: content.trim(),
            type: replyType,
            author: replyAuthor
        });

        // Update ticket timestamp.
        ticket.updatedAt = new Date();
        await ticket.save();

        // Record activity.
        await logActivity({
            ticketId: ticket._id,
            action: replyType === "Internal"
                ? "Internal Note"
                : "Public Reply",
            newValue: content.trim(),
            author: replyAuthor
        });

        return res.status(201).json({
            success: true,
            message: "Reply added successfully.",
            data: reply
        });

    } catch (error) {
        console.error("Add Reply Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add reply."
        });
    }
};

// =====================================
// GET REPLIES AND INTERNAL NOTES
// =====================================

const getReplies = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const user = req.user;

        const ticket = await getAuthorizedTicket(
            ticketId,
            user,
            res
        );

        if (!ticket) return;

        const filter = {
            ticket: ticket._id
        };

        // Customers must never see internal notes.
        if (user.role === "Customer") {
            filter.type = "Public";
        }

        const replies = await Reply.find(filter)
            .sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            count: replies.length,
            data: replies
        });

    } catch (error) {
        console.error("Get Replies Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve replies."
        });
    }
};

// =====================================
// GET TICKET ACTIVITY HISTORY
// =====================================

const getActivities = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const user = req.user;

        const ticket = await getAuthorizedTicket(
            ticketId,
            user,
            res
        );

        if (!ticket) return;

        const filter = {
            ticket: ticket._id
        };

        // Customers cannot see internal note activity.
        if (user.role === "Customer") {
            filter.action = {
                $ne: "Internal Note"
            };
        }

        const activities = await Activity.find(filter)
            .sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            count: activities.length,
            data: activities
        });

    } catch (error) {
        console.error("Get Activities Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve ticket activity."
        });
    }
};

// =====================================
// EXPORT CONTROLLERS
// =====================================

module.exports = {
    addReply,
    getReplies,
    getActivities
};