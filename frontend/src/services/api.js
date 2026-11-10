
import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json"
    }
});

// =====================================
// JWT AUTHENTICATION INTERCEPTOR
// =====================================

API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);


// =====================================
// AUTHENTICATION
// =====================================

export const loginUser = (data) =>
    API.post("/auth/login", data);

export const registerUser = (data) =>
    API.post("/auth/register", data);

export const getMe = () =>
    API.get("/auth/me");

export const updateProfile = (data) =>
    API.put("/auth/profile", data);


// =====================================
// DASHBOARD
// =====================================

export const getDashboard = () =>
    API.get("/dashboard");


// =====================================
// TICKETS
// =====================================

export const getTickets = (params = {}) =>
    API.get("/tickets", { params });

export const getTicket = (id) =>
    API.get(`/tickets/${id}`);

export const createTicket = (data) =>
    API.post("/tickets", data);

export const updateTicket = (id, data) =>
    API.put(`/tickets/${id}`, data);


// =====================================
// REPLIES
// =====================================

export const getReplies = (ticketId) =>
    API.get(`/replies/${ticketId}`);

export const addReply = (ticketId, data) =>
    API.post(`/replies/${ticketId}`, data);

export const getActivities = (ticketId) =>
    API.get(`/replies/${ticketId}/activities`);


// =====================================
// FILE ATTACHMENTS
// =====================================

// Upload multiple attachments to a ticket
export const uploadAttachments = (ticketId, files) => {
    const formData = new FormData();

    Array.from(files).forEach((file) => {
        formData.append("attachments", file);
    });

    return API.post(
        `/attachments/tickets/${ticketId}`,
        formData,
        {
            headers: {
                "Content-Type": undefined
            }
        }
    );
};

// Get all attachments for a ticket
export const getTicketAttachments = (ticketId) =>
    API.get(`/attachments/tickets/${ticketId}`);
export const downloadAttachment = (ticketId, attachmentId) =>
    API.get(
        `/attachments/tickets/${ticketId}/${attachmentId}/download`,
        {
            responseType: "blob"
        }
    );
// Download a particular attachment



// =====================================
// AGENT MANAGEMENT (ADMIN ONLY)
// =====================================

// Create a new Agent
export const createAgent = (data) =>
    API.post("/users/agents", data);

// Get all Agents
export const getAgents = () =>
    API.get("/users/agents");

// Activate or deactivate an Agent
export const updateAgentStatus = (id, isActive) =>
    API.patch(`/users/agents/${id}/status`, {
        isActive
    });


// =====================================
// DEFAULT EXPORT
// =====================================

export default API;
