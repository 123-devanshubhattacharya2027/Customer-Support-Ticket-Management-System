
const express = require("express");

const {
    createTicket,
    getTickets,
    getTicketById,
    updateTicket
} = require("../controllers/ticketController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// All ticket endpoints require authentication.
router.use(protect);

// Admin, Agent and Customer can create tickets.
router.post(
    "/",
    authorizeRoles("Admin", "Agent", "Customer"),
    createTicket
);

// All roles can request tickets.
// Controller applies the appropriate ownership filter.
router.get(
    "/",
    authorizeRoles("Admin", "Agent", "Customer"),
    getTickets
);

// All roles can request a ticket.
// Controller checks ownership or assignment.
router.get(
    "/:id",
    authorizeRoles("Admin", "Agent", "Customer"),
    getTicketById
);

// Only Admin and Agent can update tickets.
router.put(
    "/:id",
    authorizeRoles("Admin", "Agent"),
    updateTicket
);

module.exports = router;

