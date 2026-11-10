import { useCallback, useEffect, useState } from "react";

import {
    X,
    Save,
    Loader2,
    AlertCircle,
    User,
    Mail,
    FileText,
    Flag,
    Clock,
    Ticket,
    MessageSquare,
    Send,
    Lock,
    Globe,
    History
} from "lucide-react";

import {
    getTicket,
    updateTicket,
    getReplies,
    addReply,
    getActivities
} from "../services/api";

const EMPTY_FORM = {
    subject: "",
    customerName: "",
    customerEmail: "",
    description: "",
    priority: "Medium",
    status: "Open",
    assignedTo: ""
};

// Handles common API response structures.
const getResponseData = (response) => {
    const body = response?.data;

    if (body?.data !== undefined) return body.data;
    if (body?.ticket !== undefined) return body.ticket;

    return body;
};

function TicketDetails({ ticketId, onClose, onUpdated, agents = [] }) {

    // =====================================
    // STATES
    // =====================================

    const [ticket, setTicket] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const [replies, setReplies] = useState([]);
    const [activities, setActivities] = useState([]);

    const [replyContent, setReplyContent] = useState("");
    const [replyType, setReplyType] = useState("Public");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sendingReply, setSendingReply] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =====================================
    // FETCH REPLIES
    // =====================================

    const fetchReplies = useCallback(async () => {
        try {
            const response = await getReplies(ticketId);
            const data = getResponseData(response);

            setReplies(Array.isArray(data) ? data : []);

        } catch (err) {
            console.error("Replies fetching error:", err);
            setReplies([]);
        }
    }, [ticketId]);

    // =====================================
    // FETCH ACTIVITY HISTORY
    // =====================================

    const fetchActivities = useCallback(async () => {
        try {
            const response = await getActivities(ticketId);
            const data = getResponseData(response);

            setActivities(Array.isArray(data) ? data : []);

        } catch (err) {
            console.error("Activity fetching error:", err);
            setActivities([]);
        }
    }, [ticketId]);

    // =====================================
    // FETCH TICKET DETAILS
    // =====================================

    const fetchTicketDetails = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const response = await getTicket(ticketId);
            const ticketData = getResponseData(response);

            console.log("Ticket details response:", response.data);
            console.log("Ticket data:", ticketData);

            if (
                !ticketData ||
                typeof ticketData !== "object" ||
                !ticketData._id
            ) {
                throw new Error(
                    "Ticket details were not returned in the expected format. Check GET /api/tickets/:id."
                );
            }

            setTicket(ticketData);

            setForm({
                subject: ticketData.subject ?? "",
                customerName: ticketData.customerName ?? "",
                customerEmail: ticketData.customerEmail ?? "",
                description: ticketData.description ?? "",
                priority: ticketData.priority ?? "Medium",
                status: ticketData.status ?? "Open",
                assignedTo: ticketData.assignedTo?._id || ticketData.assignedTo ||
                    agents.find((agent) => agent.name === ticketData.assignee)?._id || ""
            });

            await Promise.all([
                fetchReplies(),
                fetchActivities()
            ]);

        } catch (err) {
            console.error("Ticket details error:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to load ticket details."
            );

        } finally {
            setLoading(false);
        }
    }, [ticketId, fetchReplies, fetchActivities]);

    // =====================================
    // LOAD DETAILS WHEN MODAL OPENS
    // =====================================

    useEffect(() => {
        fetchTicketDetails();
    }, [fetchTicketDetails]);

    // =====================================
    // HANDLE INPUT CHANGES
    // =====================================

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previousForm) => ({
            ...previousForm,
            [name]: value
        }));

        setError("");
        setSuccess("");
    };

    // =====================================
    // UPDATE TICKET
    // =====================================

    const handleUpdate = async (event) => {
        event.preventDefault();

        if (!form.subject.trim()) {
            setError("Subject is required.");
            return;
        }

        if (!form.description.trim()) {
            setError("Description is required.");
            return;
        }

        if (
            !form.customerName.trim() &&
            !form.customerEmail.trim()
        ) {
            setError("Enter customer name or email.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const updatedData = {
                subject: form.subject.trim(),
                customerName: form.customerName.trim(),
                customerEmail: form.customerEmail.trim(),
                description: form.description.trim(),
                priority: form.priority,
                status: form.status,
                assignedTo: form.assignedTo || null
            };

            const response = await updateTicket(
                ticketId,
                updatedData
            );

            const updatedTicket = getResponseData(response);

            // Update the modal with the server response.
            if (
                updatedTicket &&
                typeof updatedTicket === "object"
            ) {
                setTicket((previousTicket) => ({
                    ...(previousTicket || {}),
                    ...updatedTicket
                }));

                setForm((previousForm) => ({
                    ...previousForm,
                    subject:
                        updatedTicket.subject ?? previousForm.subject,
                    customerName:
                        updatedTicket.customerName ?? previousForm.customerName,
                    customerEmail:
                        updatedTicket.customerEmail ?? previousForm.customerEmail,
                    description:
                        updatedTicket.description ?? previousForm.description,
                    priority:
                        updatedTicket.priority ?? previousForm.priority,
                    status:
                        updatedTicket.status ?? previousForm.status,
                    assignedTo:
                        updatedTicket.assignedTo?._id ||
                        updatedTicket.assignedTo ||
                        previousForm.assignedTo
                }));
            }

            await fetchActivities();

            setSuccess("Ticket updated successfully!");

            if (onUpdated) {
                await onUpdated();
            }

        } catch (err) {
            console.error("Ticket update error:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to update ticket. Please try again."
            );

        } finally {
            setSaving(false);
        }
    };

    // =====================================
    // SEND PUBLIC REPLY / INTERNAL NOTE
    // =====================================

    const handleSendReply = async (event) => {
        event.preventDefault();

        if (!replyContent.trim()) {
            setError("Please enter a message.");
            return;
        }

        try {
            setSendingReply(true);
            setError("");
            setSuccess("");

            await addReply(ticketId, {
                content: replyContent.trim(),
                type: replyType,
                author: "Support Agent"
            });

            setReplyContent("");

            await Promise.all([
                fetchReplies(),
                fetchActivities()
            ]);

            setSuccess(
                replyType === "Public"
                    ? "Public reply added successfully!"
                    : "Internal note added successfully!"
            );

            if (onUpdated) {
                await onUpdated();
            }

        } catch (err) {
            console.error("Reply submission error:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to send message. Please try again."
            );

        } finally {
            setSendingReply(false);
        }
    };

    // =====================================
    // LOADING SCREEN
    // =====================================

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

                <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-3">

                    <Loader2
                        size={35}
                        className="animate-spin text-indigo-600"
                    />

                    <p className="text-slate-600 font-medium">
                        Loading ticket details...
                    </p>

                </div>

            </div>
        );
    }

    // =====================================
    // MAIN MODAL
    // =====================================

    return (

        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={onClose}
        >

            <div
                className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl"
                onClick={(event) => event.stopPropagation()}
            >

                {/* HEADER */}

                <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex justify-between items-center z-10">

                    <div className="flex items-center gap-3">

                        <div className="bg-indigo-100 text-indigo-600 p-3 rounded-lg">
                            <Ticket size={23} />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                Ticket Details
                            </h2>

                            <p className="text-xs text-slate-500 mt-1">
                                Ticket ID: #{String(ticketId).slice(-6)}
                            </p>
                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-100"
                        aria-label="Close ticket details"
                    >
                        <X size={22} />
                    </button>

                </div>

                {/* BODY */}

                <div className="p-6">

                    {/* ERROR MESSAGE */}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-5 flex items-center gap-2">

                            <AlertCircle size={18} />

                            <span className="text-sm">
                                {error}
                            </span>

                        </div>
                    )}

                    {/* SUCCESS MESSAGE */}

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-5 text-sm">
                            {success}
                        </div>
                    )}

                    {/* EDIT TICKET FORM */}

                    <form onSubmit={handleUpdate} className="space-y-5">

                        {/* SUBJECT */}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Ticket Subject *
                            </label>

                            <input
                                type="text"
                                name="subject"
                                value={form.subject}
                                onChange={handleChange}
                                placeholder="Enter ticket subject"
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        {/* CUSTOMER INFORMATION */}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    <span className="inline-flex items-center gap-2">
                                        <User size={16} />
                                        Customer Name
                                    </span>
                                </label>

                                <input
                                    type="text"
                                    name="customerName"
                                    value={form.customerName}
                                    onChange={handleChange}
                                    placeholder="Customer name"
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    <span className="inline-flex items-center gap-2">
                                        <Mail size={16} />
                                        Customer Email
                                    </span>
                                </label>

                                <input
                                    type="email"
                                    name="customerEmail"
                                    value={form.customerEmail}
                                    onChange={handleChange}
                                    placeholder="customer@example.com"
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                        </div>

                        {/* DESCRIPTION */}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">

                                <span className="inline-flex items-center gap-2">
                                    <FileText size={16} />
                                    Description *
                                </span>

                            </label>

                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={5}
                                placeholder="Describe the customer's issue..."
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                                required
                            />
                        </div>

                        {/* PRIORITY AND STATUS */}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">

                                    <span className="inline-flex items-center gap-2">
                                        <Flag size={16} />
                                        Priority
                                    </span>

                                </label>

                                <select
                                    name="priority"
                                    value={form.priority}
                                    onChange={handleChange}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">

                                    <span className="inline-flex items-center gap-2">
                                        <Clock size={16} />
                                        Status
                                    </span>

                                </label>

                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="Open">Open</option>

                                    <option value="In Progress">
                                        In Progress
                                    </option>

                                    <option value="Waiting on Customer">
                                        Waiting on Customer
                                    </option>

                                    <option value="Resolved">Resolved</option>
                                </select>
                            </div>

                        </div>

                        {/* ASSIGNEE */}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Assign to Agent
                            </label>

                            <select
                                name="assignedTo"
                                value={form.assignedTo}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">
                                    Unassigned
                                </option>

                                {agents
                                    .filter((agent) => agent.isActive)
                                    .map((agent) => (
                                        <option key={agent._id} value={agent._id}>
                                            {agent.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* TICKET METADATA */}

                        {ticket && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">

                                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                                    Ticket Information
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">

                                    <div>
                                        <p className="text-slate-500">
                                            Created At
                                        </p>

                                        <p className="font-medium text-slate-700 mt-1">
                                            {ticket.createdAt
                                                ? new Date(ticket.createdAt).toLocaleString()
                                                : "Not available"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-slate-500">
                                            Last Updated
                                        </p>

                                        <p className="font-medium text-slate-700 mt-1">
                                            {ticket.updatedAt
                                                ? new Date(ticket.updatedAt).toLocaleString()
                                                : "Not available"}
                                        </p>
                                    </div>

                                </div>

                            </div>
                        )}

                        {/* SAVE BUTTON */}

                        <div className="flex justify-end pt-4 border-t border-slate-200">

                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-60"
                            >

                                {saving ? (
                                    <>
                                        <Loader2
                                            size={18}
                                            className="animate-spin"
                                        />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Save Changes
                                    </>
                                )}

                            </button>

                        </div>

                    </form>

                    {/* CONVERSATION SECTION */}

                    <div className="mt-8 pt-6 border-t border-slate-200">

                        <div className="flex items-center gap-2 mb-5">
                            <MessageSquare
                                className="text-indigo-600"
                                size={21}
                            />

                            <h3 className="text-lg font-bold text-slate-800">
                                Conversation
                            </h3>
                        </div>

                        {/* REPLIES LIST */}

                        <div className="space-y-4 mb-6">

                            {replies.length === 0 ? (
                                <div className="text-center py-6 bg-slate-50 rounded-lg text-slate-400 text-sm">
                                    No replies or notes yet.
                                </div>
                            ) : (
                                replies.map((reply) => (
                                    <div
                                        key={reply._id}
                                        className={`p-4 rounded-xl border ${
                                            reply.type === "Internal"
                                                ? "bg-amber-50 border-amber-200"
                                                : "bg-blue-50 border-blue-200"
                                        }`}
                                    >

                                        <div className="flex justify-between items-center gap-3 mb-2">

                                            <div className="flex items-center gap-2">

                                                {reply.type === "Internal" ? (
                                                    <Lock
                                                        size={15}
                                                        className="text-amber-700"
                                                    />
                                                ) : (
                                                    <Globe
                                                        size={15}
                                                        className="text-blue-700"
                                                    />
                                                )}

                                                <span className="font-semibold text-sm text-slate-800">
                                                    {reply.author || "Support Agent"}
                                                </span>

                                            </div>

                                            <span className="text-xs text-slate-500">
                                                {reply.type}
                                            </span>

                                        </div>

                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                            {reply.content}
                                        </p>

                                        <p className="text-xs text-slate-400 mt-3">
                                            {reply.createdAt
                                                ? new Date(reply.createdAt).toLocaleString()
                                                : ""}
                                        </p>

                                    </div>
                                ))
                            )}

                        </div>

                        {/* ADD REPLY FORM */}

                        <form
                            onSubmit={handleSendReply}
                            className="space-y-3"
                        >

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Message Type
                                </label>

                                <select
                                    value={replyType}
                                    onChange={(event) =>
                                        setReplyType(event.target.value)
                                    }
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="Public">
                                        Public Reply
                                    </option>

                                    <option value="Internal">
                                        Internal Note
                                    </option>
                                </select>
                            </div>

                            <textarea
                                value={replyContent}
                                onChange={(event) =>
                                    setReplyContent(event.target.value)
                                }
                                rows={3}
                                placeholder="Write your reply or internal note..."
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                            />

                            <div className="flex justify-end">

                                <button
                                    type="submit"
                                    disabled={
                                        sendingReply ||
                                        !replyContent.trim()
                                    }
                                    className="flex items-center gap-2 px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
                                >

                                    {sendingReply ? (
                                        <>
                                            <Loader2
                                                size={18}
                                                className="animate-spin"
                                            />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Send Message
                                        </>
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                    {/* ACTIVITY HISTORY TIMELINE */}

                    <div className="mt-8 pt-6 border-t border-slate-200">

                        <div className="flex items-center justify-between mb-6">

                            <div className="flex items-center gap-2">

                                <History
                                    size={21}
                                    className="text-indigo-600"
                                />

                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">
                                        Activity History
                                    </h3>

                                    <p className="text-xs text-slate-500">
                                        Track important ticket updates.
                                    </p>
                                </div>

                            </div>

                            <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-semibold">
                                {activities.length} events
                            </span>

                        </div>

                        {activities.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 rounded-lg">

                                <History
                                    size={30}
                                    className="mx-auto text-slate-300 mb-2"
                                />

                                <p className="text-sm text-slate-500">
                                    No activity recorded yet.
                                </p>

                            </div>
                        ) : (
                            <div className="space-y-5">

                                {activities.map((activity, index) => (

                                    <div
                                        key={activity._id || index}
                                        className="flex gap-3"
                                    >

                                        <div className="flex flex-col items-center">

                                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                                <History size={17} />
                                            </div>

                                            {index !== activities.length - 1 && (
                                                <div className="w-px flex-1 bg-slate-200 mt-2" />
                                            )}

                                        </div>

                                        <div className="flex-1 pb-3">

                                            <h4 className="font-semibold text-sm text-slate-800">
                                                {activity.action || "Ticket updated"}
                                            </h4>

                                            {(activity.oldValue || activity.newValue) && (
                                                <p className="text-sm text-slate-600 mt-1">
                                                    {activity.oldValue || "—"}
                                                    {" → "}
                                                    {activity.newValue || "—"}
                                                </p>
                                            )}

                                            {activity.description && (
                                                <p className="text-sm text-slate-600 mt-1">
                                                    {activity.description}
                                                </p>
                                            )}

                                            <p className="text-xs text-slate-400 mt-2">
                                                {activity.createdAt
                                                    ? new Date(activity.createdAt).toLocaleString()
                                                    : "Date unavailable"}
                                            </p>

                                        </div>

                                    </div>

                                ))}

                            </div>
                        )}

                    </div>

                    {/* CLOSE BUTTON */}

                    <div className="flex justify-end mt-8 pt-5 border-t border-slate-200">

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                        >
                            Close
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default TicketDetails;