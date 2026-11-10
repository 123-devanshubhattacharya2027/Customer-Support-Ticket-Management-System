
const Ticket = require("../models/Ticket");
const User = require("../models/User");

const getDashboardStats = async (req, res) => {
    try {
        const user = req.user;

        if (!user || !user.role) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // Restrict dashboard data according to the logged-in user's role.
        let filter = {};

        if (user.role === "Admin") {
            // Admin can see all tickets.
            filter = {};
        } else if (user.role === "Agent") {
            // Agent can see only tickets assigned to them.
            filter.assignedTo = user._id;
        } else if (user.role === "Customer") {
            // Customer can see only tickets they created.
            filter.createdBy = user._id;
        } else {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        const twentyFourHoursAgo = new Date(
            Date.now() - 24 * 60 * 60 * 1000
        );

        // Calculate statistics directly in MongoDB.
        const [
            totalTickets,
            openTickets,
            inProgressTickets,
            waitingOnCustomerTickets,
            resolvedTickets,
            urgentTickets,
            overdueTickets
        ] = await Promise.all([
            Ticket.countDocuments(filter),

            Ticket.countDocuments({
                ...filter,
                status: "Open"
            }),

            Ticket.countDocuments({
                ...filter,
                status: "In Progress"
            }),

            Ticket.countDocuments({
                ...filter,
                status: "Waiting on Customer"
            }),

            Ticket.countDocuments({
                ...filter,
                status: "Resolved"
            }),

            Ticket.countDocuments({
                ...filter,
                priority: "Urgent"
            }),

            Ticket.countDocuments({
                ...filter,
                status: { $ne: "Resolved" },
                createdAt: { $lt: twentyFourHoursAgo }
            })
        ]);

        const data = {
            totalTickets,
            openTickets,
            inProgressTickets,
            waitingOnCustomerTickets,
            resolvedTickets,
            urgentTickets,
            overdueTickets
        };

        // Additional system-wide account statistics for Admin.
        if (user.role === "Admin") {
            const [totalAgents, totalCustomers] = await Promise.all([
                User.countDocuments({
                    role: "Agent",
                    isActive: true
                }),

                User.countDocuments({
                    role: "Customer",
                    isActive: true
                })
            ]);

            data.totalAgents = totalAgents;
            data.totalCustomers = totalCustomers;
        }

        return res.status(200).json({
            success: true,
            role: user.role,
            data
        });

    } catch (error) {
        console.error("Dashboard Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics"
        });
    }
};

module.exports = { getDashboardStats };
