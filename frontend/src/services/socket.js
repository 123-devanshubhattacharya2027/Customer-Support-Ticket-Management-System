
import { io } from "socket.io-client";

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

export const connectSocket = () => {
    const token = localStorage.getItem("token");

    if (!token) {
        console.warn("Socket connection skipped: No JWT token.");
        return null;
    }

    if (socket?.connected) return socket;

    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: false,
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000
        });

        socket.on("connect", () =>
            console.log("Socket connected:", socket.id)
        );

        socket.on("connect_error", (error) =>
            console.error("Socket connection error:", error.message)
        );

        socket.on("disconnect", (reason) =>
            console.log("Socket disconnected:", reason)
        );
    } else {
        socket.auth = { token };
    }

    socket.connect();
    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }
};

export const joinTicketRoom = (ticketId) => {
    if (socket?.connected) {
        socket.emit("join_ticket", ticketId);
    }
};

export const leaveTicketRoom = (ticketId) => {
    if (socket?.connected) {
        socket.emit("leave_ticket", ticketId);
    }
};

export const startTyping = (ticketId) => {
    if (socket?.connected) {
        socket.emit("typing_start", ticketId);
    }
};

export const stopTyping = (ticketId) => {
    if (socket?.connected) {
        socket.emit("typing_stop", ticketId);
    }
};
