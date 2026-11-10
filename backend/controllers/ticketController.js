
const mongoose = require("mongoose");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Notification = require("../models/Notification");
const logActivity = require("../utils/activityLogger");

// Helper: Check whether the current user can access a ticket
const canAccessTicket = (user, ticket) => {
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


// CREATE TICKET
const createTicket = async (req, res) => {
    try {
        const {
            subject,
            customerName,
            customerEmail,
            description,
            priority
        } = req.body;

        const user = req.user;

        if (!subject?.trim() || !description?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Subject and description are required."
            });
        }

        // Customer identity must come from authenticated account.
        let finalCustomerName;
        let finalCustomerEmail;

        if (user.role === "Customer") {
            finalCustomerName = user.name;
            finalCustomerEmail = user.email;
        } else {
            finalCustomerName = customerName?.trim() || "";
            finalCustomerEmail = customerEmail?.trim() || "";
        }

        if (!finalCustomerName && !finalCustomerEmail) {
            return res.status(400).json({
                success: false,
                message: "Customer name or email is required."
            });
        }

        // Customers cannot choose their status or agent.
        let assignedTo = null;
        let assignee = "Unassigned";
        let status = "Open";

        // Agent-created tickets are assigned to that agent.
        if (user.role === "Agent") {
            assignedTo = user._id;
            assignee = user.name;
        }

        const ticket = await Ticket.create({
            subject: subject.trim(),
            customerName: finalCustomerName,
            customerEmail: finalCustomerEmail,
            description: description.trim(),
            priority: priority || "Medium",
            status,
            assignee,
            assignedTo,
            createdBy: user._id
        });

        // Record actual creator.
        await logActivity({
            ticketId: ticket._id,
            action: "Created",
            newValue: ticket.subject,
            author: user.name
        });

        // Send notification to all Admin users.
        // Notification failure should not affect ticket creation.
        try {
            const admins = await User.find({
                role: "Admin"
            }).select("_id");

            if (admins.length > 0) {
                const notifications = admins.map((admin) => ({
                    recipient: admin._id,
                    sender: user._id,
                    type: "TICKET_CREATED",
                    title: "New Ticket Created",
                    message: `${user.name} created a new ticket: ${ticket.subject}`,
                    ticket: ticket._id
                }));

                await Notification.insertMany(notifications);
            }
        } catch (notificationError) {
            console.error(
                "Ticket created, but Admin notification failed:",
                notificationError.message
            );
        }

        return res.status(201).json({
            success: true,
            message: "Ticket created successfully.",
            data: ticket
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// GET ALL TICKETS
const getTickets = async (req, res) => {
    try {
        const {
            search,
            status,
            priority,
            assignee,
            sort
        } = req.query;

        const user = req.user;

        // Start with role-based filter.
        const filter = {};

        if (user.role === "Customer") {
            filter.createdBy = user._id;
        } else if (user.role === "Agent") {
            filter.assignedTo = user._id;
        } else if (user.role !== "Admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied."
            });
        }

        // Apply optional filters without removing role restrictions.
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        // Only Admin can filter complete ticket list by assignee.
        if (assignee && user.role === "Admin") {
            filter.assignee = assignee;
        }

        // Search by subject, customer name or email.
        if (search?.trim()) {
            const safeSearch = search.trim().slice(0, 100);

            filter.$or = [
                { subject: { $regex: safeSearch, $options: "i" } },
                { customerName: { $regex: safeSearch, $options: "i" } },
                { customerEmail: { $regex: safeSearch, $options: "i" } }
            ];
        }

        let tickets = await Ticket.find(filter)
            .sort({ updatedAt: -1 });

        // Existing priority sorting functionality.
        if (sort === "priority") {
            const priorityRank = {
                Urgent: 4,
                High: 3,
                Medium: 2,
                Low: 1
            };

            tickets.sort((a, b) =>
                priorityRank[b.priority] - priorityRank[a.priority]
            );
        }

        return res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// GET SINGLE TICKET
const getTicketById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID."
            });
        }

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found."
            });
        }

        if (!canAccessTicket(req.user, ticket)) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to view this ticket."
            });
        }

        return res.status(200).json({
            success: true,
            data: ticket
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// UPDATE TICKET
const updateTicket = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID."
            });
        }

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found."
            });
        }

        const user = req.user;

        if (!canAccessTicket(user, ticket)) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update this ticket."
            });
        }

        // Customers cannot update tickets through this endpoint.
        if (user.role === "Customer") {
            return res.status(403).json({
                success: false,
                message: "Customers cannot update tickets."
            });
        }

        // Fields that Admin and Agent may edit.
        const agentAllowedFields = [
            "subject",
            "description",
            "priority",
            "status"
        ];

        // Admin can additionally change customer details and assignment.
        const adminAllowedFields = [
            ...agentAllowedFields,
            "customerName",
            "customerEmail",
            "assignedTo"
        ];

        const allowedFields =
            user.role === "Admin"
                ? adminAllowedFields
                : agentAllowedFields;

        const changes = [];

        for (const field of allowedFields) {
            if (!Object.prototype.hasOwnProperty.call(req.body, field)) {
                continue;
            }

            let newValue = req.body[field];

            if (typeof newValue === "string") {
                newValue = newValue.trim();
            }

            if (field === "assignedTo") {
                // Admin can unassign a ticket using null or "".
                if (newValue === null || newValue === "") {
                    newValue = null;
                } else {
                    if (!mongoose.isValidObjectId(newValue)) {
                        return res.status(400).json({
                            success: false,
                            message: "Invalid agent ID."
                        });
                    }

                    const agent = await User.findOne({
                        _id: newValue,
                        role: "Agent",
                        isActive: true
                    });

                    if (!agent) {
                        return res.status(400).json({
                            success: false,
                            message: "Selected agent does not exist or is inactive."
                        });
                    }

                    // Maintain legacy assignee field.
                    ticket.assignee = agent.name;
                }

                if (!newValue) {
                    ticket.assignee = "Unassigned";
                }
            }

            const oldValue = ticket[field];

            const oldComparable =
                oldValue && oldValue.toString
                    ? oldValue.toString()
                    : oldValue;

            const newComparable =
                newValue && newValue.toString
                    ? newValue.toString()
                    : newValue;

            if (oldComparable !== newComparable) {
                changes.push({
                    field,
                    oldValue: oldValue || null,
                    newValue: newValue || null
                });

                ticket[field] = newValue;
            }
        }

        await ticket.save();

        // Record important changes with the actual logged-in user.
        for (const change of changes) {
            let action = null;

            if (change.field === "status") {
                action = "Status Changed";
            }

            if (change.field === "priority") {
                action = "Priority Changed";
            }

            if (change.field === "assignedTo") {
                action = "Assigned";
            }

            if (action) {
                await logActivity({
                    ticketId: ticket._id,
                    action,
                    oldValue: change.oldValue,
                    newValue: change.newValue,
                    author: user.name
                });
            }
        }

        // Notify the newly assigned Agent.
        
// Notify Customer when ticket status changes.
try {
    const statusChange = changes.find(
        (change) => change.field === "status"
    );

    if (statusChange && ticket.createdBy) {
        await Notification.create({
            recipient: ticket.createdBy,
            sender: user._id,
            type: "TICKET_STATUS_CHANGED",
            title: "Ticket Status Updated",
            message: `Your ticket "${ticket.subject}" status changed from ${statusChange.oldValue} to ${statusChange.newValue}.`,
            ticket: ticket._id
        });
    }
} catch (notificationError) {
    console.error(
        "Ticket updated, but Customer status notification failed:",
        notificationError.message
    );
}

        // Only send when assignedTo actually changes to a valid Agent.
        try {
            const assignmentChange = changes.find(
                (change) => change.field === "assignedTo"
            );

            if (assignmentChange && assignmentChange.newValue) {
                const assignedAgent = await User.findOne({
                    _id: assignmentChange.newValue,
                    role: "Agent",
                    isActive: true
                }).select("_id name");

                if (assignedAgent) {
                    await Notification.create({
                        recipient: assignedAgent._id,
                        sender: user._id,
                        type: "TICKET_ASSIGNED",
                        title: "New Ticket Assigned",
                        message: `You have been assigned a ticket: ${ticket.subject}`,
                        ticket: ticket._id
                    });
                }
            }
        } catch (notificationError) {
            console.error(
                "Ticket updated, but Agent assignment notification failed:",
                notificationError.message
            );
        }

        return res.status(200).json({
            success: true,
            message: "Ticket updated successfully.",
            data: ticket
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// EXPORT CONTROLLERS
module.exports = {
    createTicket,
    getTickets,
    getTicketById,
    updateTicket
};
