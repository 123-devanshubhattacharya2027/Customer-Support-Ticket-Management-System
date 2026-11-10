
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Ticket = require("../models/Ticket");

const initializeSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // =====================================
    // SOCKET AUTHENTICATION
    // =====================================

    io.use(async (socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers.authorization?.replace(
                    "Bearer ",
                    ""
                );

            if (!token) {
                return next(new Error("Authentication required."));
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            const user = await User.findById(decoded.id)
                .select("-password");

            if (!user || !user.isActive) {
                return next(new Error("Invalid or inactive user."));
            }

            socket.user = user;

            next();

        } catch (error) {
            next(new Error("Socket authentication failed."));
        }
    });

    // =====================================
    // SOCKET CONNECTION
    // =====================================

    io.on("connection", (socket) => {
        const user = socket.user;

        console.log(`User connected: ${user.name}`);

        // =====================================
        // JOIN TICKET CONVERSATION
        // =====================================

        socket.on("join_ticket", async (ticketId) => {
            try {
                if (
                    typeof ticketId !== "string" ||
                    !mongoose.isValidObjectId(ticketId)
                ) {
                    return socket.emit("socket_error", {
                        message: "Invalid ticket ID."
                    });
                }

                const ticket = await Ticket.findById(ticketId);

                if (!ticket) {
                    return socket.emit("socket_error", {
                        message: "Ticket not found."
                    });
                }

                const isAdmin = user.role === "Admin";

                const isAssignedAgent =
                    user.role === "Agent" &&
                    ticket.assignedTo?.toString() === user._id.toString();

                const isTicketCustomer =
                    user.role === "Customer" &&
                    ticket.createdBy?.toString() === user._id.toString();

                if (
                    !isAdmin &&
                    !isAssignedAgent &&
                    !isTicketCustomer
                ) {
                    return socket.emit("socket_error", {
                        message: "You cannot access this conversation."
                    });
                }

                // Use canonical MongoDB ID.
                const canonicalTicketId = ticket._id.toString();

                // Public conversation room.
                const publicRoom = `ticket:${canonicalTicketId}`;

                await socket.join(publicRoom);
                console.log(
    `JOINED ROOM: ${user.name} | ${user.role} | ${publicRoom}`
);

                // Only Admins and assigned Agents join staff room.
                if (isAdmin || isAssignedAgent) {
                    const staffRoom = `ticket:${canonicalTicketId}:staff`;

                    await socket.join(staffRoom);
                }

                socket.emit("ticket_joined", {
                    ticketId: canonicalTicketId,
                    message: "Joined ticket conversation."
                });

            } catch (error) {
                console.error("Join ticket error:", error);

                socket.emit("socket_error", {
                    message: "Unable to join ticket conversation."
                });
            }
        });

        // =====================================
        // LEAVE TICKET CONVERSATION
        // =====================================

        socket.on("leave_ticket", async (ticketId) => {
            try {
                if (
                    typeof ticketId !== "string" ||
                    !mongoose.isValidObjectId(ticketId)
                ) {
                    return;
                }

                const canonicalTicketId =
                    new mongoose.Types.ObjectId(ticketId).toString();

                await socket.leave(`ticket:${canonicalTicketId}`);

                await socket.leave(
                    `ticket:${canonicalTicketId}:staff`
                );

            } catch (error) {
                console.error("Leave ticket error:", error);
            }
        });

        // =====================================
        // TYPING INDICATOR
        // =====================================

        
socket.on("typing_start", (ticketId) => {
    console.log("TYPING START:", user.name, ticketId);

    if (
        typeof ticketId !== "string" ||
        !mongoose.isValidObjectId(ticketId)
    ) {
        console.log("Invalid typing ticket ID");
        return;
    }

    const canonicalTicketId =
        new mongoose.Types.ObjectId(ticketId).toString();

    const room = `ticket:${canonicalTicketId}`;

    console.log("Socket rooms:", [...socket.rooms]);
    console.log("Expected room:", room);

    if (socket.rooms.has(room)) {
        console.log("Broadcasting typing event");

        socket.to(room).emit("user_typing", {
            ticketId: canonicalTicketId,
            userId: user._id.toString(),
            userName: user.name
        });
    } else {
        console.log("Socket has not joined ticket room");
    }
});

socket.on("typing_stop", (ticketId) => {
    console.log("TYPING STOP:", user.name, ticketId);

    if (
        typeof ticketId !== "string" ||
        !mongoose.isValidObjectId(ticketId)
    ) {
        return;
    }

    const canonicalTicketId =
        new mongoose.Types.ObjectId(ticketId).toString();

    const room = `ticket:${canonicalTicketId}`;

    if (socket.rooms.has(room)) {
        console.log("Broadcasting stopped typing");

        socket.to(room).emit("user_stopped_typing", {
            ticketId: canonicalTicketId,
            userId: user._id.toString()
        });
    } else {
        console.log("Socket has not joined ticket room");
    }
});


        // =====================================
        // STOP TYPING INDICATOR
        // =====================================

        socket.on("typing_stop", (ticketId) => {
            if (
                typeof ticketId !== "string" ||
                !mongoose.isValidObjectId(ticketId)
            ) {
                return;
            }

            const canonicalTicketId =
                new mongoose.Types.ObjectId(ticketId).toString();

            const room = `ticket:${canonicalTicketId}`;

            if (socket.rooms.has(room)) {
                socket.to(room).emit("user_stopped_typing", {
                    ticketId: canonicalTicketId,
                    userId: user._id.toString()
                });
            }
        });

        // =====================================
        // DISCONNECT
        // =====================================

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${user.name}`);
        });
    });

    return io;
};

module.exports = initializeSocket;
