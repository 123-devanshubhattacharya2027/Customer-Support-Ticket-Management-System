
const User = require("../models/User");
const Ticket = require("../models/Ticket");

// =====================================
// CREATE AGENT (ADMIN ONLY)
// =====================================

const createAgent = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required."
            });
        }

        // Validate input types
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid input format."
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        // Validate name
        if (!cleanName || cleanName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Name must contain 1 to 100 characters."
            });
        }

        // Validate email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address."
            });
        }

        // Validate password
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });
        }

        // Check whether email already exists
        const existingUser = await User.findOne({
            email: cleanEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        // Create Agent account
        const agent = await User.create({
            name: cleanName,
            email: cleanEmail,
            password,
            role: "Agent",
            isActive: true
        });

        return res.status(201).json({
            success: true,
            message: "Agent created successfully.",
            data: {
                _id: agent._id,
                name: agent.name,
                email: agent.email,
                role: agent.role,
                isActive: agent.isActive,
                createdAt: agent.createdAt
            }
        });

    } catch (error) {
        console.error("Create agent error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create agent."
        });
    }
};


// =====================================
// GET ALL AGENTS (ADMIN ONLY)
// =====================================

const getAgents = async (req, res) => {
    try {
        // Retrieve all Agent accounts
        const agents = await User.find({
            role: "Agent"
        })
            .select("name email role isActive createdAt")
            .sort({ createdAt: -1 })
            .lean();

        // Collect Agent IDs
        const agentIds = agents.map(agent => agent._id);

        // Count tickets assigned to each Agent
        const ticketCounts = await Ticket.aggregate([
            {
                $match: {
                    assignedTo: {
                        $in: agentIds
                    }
                }
            },
            {
                $group: {
                    _id: "$assignedTo",
                    totalTickets: {
                        $sum: 1
                    }
                }
            }
        ]);

        // Convert ticket counts into a Map
        const countMap = new Map(
            ticketCounts.map(item => [
                item._id.toString(),
                item.totalTickets
            ])
        );

        // Combine Agent details and ticket counts
        const result = agents.map(agent => ({
            ...agent,
            assignedTickets:
                countMap.get(agent._id.toString()) || 0
        }));

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });

    } catch (error) {
        console.error("Get agents error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve agents."
        });
    }
};


// =====================================
// ACTIVATE / DEACTIVATE AGENT
// (ADMIN ONLY)
// =====================================

const updateAgentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        // Validate MongoDB ObjectId
        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid agent ID."
            });
        }

        // Validate status
        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isActive must be true or false."
            });
        }

        // Find Agent account
        const agent = await User.findOne({
            _id: id,
            role: "Agent"
        });

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent not found."
            });
        }

        // Prevent deactivation if unresolved tickets are assigned
        if (isActive === false) {
            const unresolvedTicket = await Ticket.findOne({
                assignedTo: agent._id,
                status: { $ne: "Resolved" }
            });

            if (unresolvedTicket) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Cannot deactivate this Agent because unresolved tickets are assigned. Reassign or resolve those tickets first."
                });
            }
        }

        // Update Agent status
        agent.isActive = isActive;
        await agent.save();

        return res.status(200).json({
            success: true,
            message: isActive
                ? "Agent activated successfully."
                : "Agent deactivated successfully.",
            data: {
                _id: agent._id,
                name: agent.name,
                email: agent.email,
                role: agent.role,
                isActive: agent.isActive
            }
        });

    } catch (error) {
        console.error("Update agent status error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update agent status."
        });
    }
};


// =====================================
// EXPORT CONTROLLER FUNCTIONS
// =====================================

module.exports = {
    createAgent,
    getAgents,
    updateAgentStatus
};
