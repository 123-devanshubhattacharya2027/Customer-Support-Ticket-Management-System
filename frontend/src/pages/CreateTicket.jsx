
import { useState } from "react";
import { createTicket } from "../services/api";
import { X, Send, AlertCircle } from "lucide-react";

function CreateTicket({ onClose, onCreated }) {
    const [form, setForm] = useState({
        subject: "",
        customerName: "",
        customerEmail: "",
        description: "",
        priority: "Medium",
        status: "Open",
        assignee: "Unassigned"
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (
            !form.subject.trim() ||
            !form.description.trim() ||
            (!form.customerName.trim() && !form.customerEmail.trim())
        ) {
            setError(
                "Subject, description and customer name or email are required."
            );
            return;
        }

        try {
            setLoading(true);

            await createTicket({
                ...form,
                subject: form.subject.trim(),
                customerName: form.customerName.trim(),
                customerEmail: form.customerEmail.trim(),
                description: form.description.trim()
            });

            await onCreated?.();
            onClose();

        } catch (err) {
            console.error("Create ticket error:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to create ticket. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = `
        w-full
        bg-white
        text-slate-900
        placeholder:text-slate-400
        border border-slate-300
        rounded-xl
        px-4 py-3
        outline-none
        transition-all
        duration-200
        focus:border-indigo-500
        focus:ring-4
        focus:ring-indigo-500/10
        hover:border-slate-400
    `;

    const labelStyle = `
        block
        text-sm
        font-semibold
        text-slate-700
        mb-2
    `;

    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                {/* HEADER */}

                <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-6 border-b border-slate-200">

                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Create New Ticket
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            Create a customer support request.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                        aria-label="Close modal"
                    >
                        <X size={22} />
                    </button>

                </div>

                {/* FORM */}

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {error && (
                        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
                            <AlertCircle size={19} className="shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* SUBJECT */}

                    <div>
                        <label className={labelStyle}>
                            Subject <span className="text-red-500">*</span>
                        </label>

                        <input
                            name="subject"
                            value={form.subject}
                            onChange={handleChange}
                            className={inputStyle}
                            placeholder="Enter ticket subject"
                            required
                        />
                    </div>

                    {/* CUSTOMER DETAILS */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div>
                            <label className={labelStyle}>
                                Customer Name
                            </label>

                            <input
                                name="customerName"
                                value={form.customerName}
                                onChange={handleChange}
                                className={inputStyle}
                                placeholder="Enter customer name"
                            />
                        </div>

                        <div>
                            <label className={labelStyle}>
                                Customer Email
                            </label>

                            <input
                                type="email"
                                name="customerEmail"
                                value={form.customerEmail}
                                onChange={handleChange}
                                className={inputStyle}
                                placeholder="customer@email.com"
                            />
                        </div>

                    </div>

                    {/* DESCRIPTION */}

                    <div>
                        <label className={labelStyle}>
                            Description <span className="text-red-500">*</span>
                        </label>

                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            className={`${inputStyle} resize-y min-h-28`}
                            rows={4}
                            placeholder="Describe the customer issue..."
                            required
                        />
                    </div>

                    {/* PRIORITY, STATUS AND ASSIGNEE */}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <div>
                            <label className={labelStyle}>
                                Priority
                            </label>

                            <select
                                name="priority"
                                value={form.priority}
                                onChange={handleChange}
                                className={inputStyle}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelStyle}>
                                Status
                            </label>

                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className={inputStyle}
                            >
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Waiting on Customer">
                                    Waiting on Customer
                                </option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelStyle}>
                                Assignee
                            </label>

                            <select
                                name="assignee"
                                value={form.assignee}
                                onChange={handleChange}
                                className={inputStyle}
                            >
                                <option value="Unassigned">Unassigned</option>
                                <option value="Agent Rahul">Agent Rahul</option>
                                <option value="Agent Amit">Agent Amit</option>
                                <option value="Agent Priya">Agent Priya</option>
                            </select>
                        </div>

                    </div>

                    {/* FOOTER */}

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-slate-200">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-5 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
                        >
                            <Send size={17} />

                            {loading ? "Creating..." : "Create Ticket"}
                        </button>

                    </div>

                </form>

            </div>
        </div>
    );
}

export default CreateTicket;
