
import { useState } from "react";
import {
    createTicket,
    uploadAttachments
} from "../services/api";

import {
    X,
    Send,
    AlertCircle,
    Paperclip,
    FileText,
    Upload,
    Loader2
} from "lucide-react";

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

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

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadingAttachments, setUploadingAttachments] = useState(false);
    const [ticketCreated, setTicketCreated] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =====================================
    // HANDLE FORM CHANGES
    // =====================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));

        setError("");
    };

    // =====================================
    // HANDLE FILE SELECTION
    // =====================================

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);

        setError("");
        setSuccess("");

        if (files.length > MAX_FILES) {
            setError("You can select a maximum of 5 files.");
            e.target.value = "";
            return;
        }

        const invalidFile = files.find(
            (file) => !ALLOWED_TYPES.includes(file.type)
        );

        if (invalidFile) {
            setError(
                `Unsupported file type: ${invalidFile.name}`
            );
            e.target.value = "";
            return;
        }

        const oversizedFile = files.find(
            (file) => file.size > MAX_FILE_SIZE
        );

        if (oversizedFile) {
            setError(
                `${oversizedFile.name} exceeds the 5 MB limit.`
            );
            e.target.value = "";
            return;
        }

        setSelectedFiles(files);

        e.target.value = "";
    };

    // =====================================
    // REMOVE SELECTED FILE
    // =====================================

    const handleRemoveFile = (indexToRemove) => {
        setSelectedFiles((previousFiles) =>
            previousFiles.filter(
                (_, index) => index !== indexToRemove
            )
        );
    };

    // =====================================
    // CREATE TICKET AND UPLOAD ATTACHMENTS
    // =====================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (
            !form.subject.trim() ||
            !form.description.trim() ||
            (
                !form.customerName.trim() &&
                !form.customerEmail.trim()
            )
        ) {
            setError(
                "Subject, description and customer name or email are required."
            );
            return;
        }

        try {
            setLoading(true);

            // STEP 1: CREATE TICKET

            const response = await createTicket({
                ...form,
                subject: form.subject.trim(),
                customerName: form.customerName.trim(),
                customerEmail: form.customerEmail.trim(),
                description: form.description.trim()
            });

            // Extract the created ticket from common API responses.

            const body = response.data;

            const createdTicket =
                body?.ticket ??
                body?.data?.ticket ??
                body?.data ??
                body;

            const newTicketId =
                createdTicket?._id ??
                createdTicket?.id ??
                createdTicket?.ticketId;

            // Ticket was created, but the response did not provide an ID.

            if (!newTicketId && selectedFiles.length > 0) {
                setTicketCreated(true);

                await onCreated?.();

                setError(
                    "Ticket was created, but its ID was not returned. Open the ticket and upload attachments from Ticket Details."
                );

                return;
            }

            setTicketCreated(true);

            // STEP 2: UPLOAD ATTACHMENTS

            if (selectedFiles.length > 0) {

                try {
                    setUploadingAttachments(true);

                    await uploadAttachments(
                        newTicketId,
                        selectedFiles
                    );

                    setSuccess(
                        "Ticket and attachments created successfully!"
                    );

                } catch (uploadError) {

                    console.error(
                        "Attachment upload error:",
                        uploadError
                    );

                    await onCreated?.();

                    setError(
                        `Ticket was created successfully, but attachment upload failed: ${
                            uploadError.response?.data?.message ||
                            uploadError.message ||
                            "Please upload the files from Ticket Details."
                        }`
                    );

                    return;

                } finally {
                    setUploadingAttachments(false);
                }

            } else {
                setSuccess("Ticket created successfully!");
            }

            // STEP 3: REFRESH TICKET LIST

            await onCreated?.();

            // STEP 4: CLOSE MODAL

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

    // =====================================
    // STYLES
    // =====================================

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

    // =====================================
    // MAIN COMPONENT
    // =====================================

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
                        disabled={loading}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition disabled:opacity-50"
                        aria-label="Close modal"
                    >
                        <X size={22} />
                    </button>

                </div>

                {/* FORM */}

                <form
                    onSubmit={handleSubmit}
                    className="p-6 space-y-5"
                >

                    {/* ERROR MESSAGE */}

                    {error && (
                        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">

                            <AlertCircle
                                size={19}
                                className="shrink-0 mt-0.5"
                            />

                            <p>{error}</p>

                        </div>
                    )}

                    {/* SUCCESS MESSAGE */}

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-sm">
                            {success}
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
                            disabled={ticketCreated}
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
                                disabled={ticketCreated}
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
                                disabled={ticketCreated}
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
                            disabled={ticketCreated}
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
                                disabled={ticketCreated}
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
                                disabled={ticketCreated}
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
                                disabled={ticketCreated}
                            >
                                <option value="Unassigned">Unassigned</option>
                                <option value="Agent Rahul">Agent Rahul</option>
                                <option value="Agent Amit">Agent Amit</option>
                                <option value="Agent Priya">Agent Priya</option>
                            </select>
                        </div>

                    </div>

                    {/* FILE ATTACHMENTS */}

                    <div>

                        <label className={labelStyle}>
                            <span className="inline-flex items-center gap-2">
                                <Paperclip size={17} />
                                Attach Files (Optional)
                            </span>
                        </label>

                        <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-indigo-300 rounded-xl bg-indigo-50/40 cursor-pointer hover:bg-indigo-50 transition">

                            <Upload
                                size={28}
                                className="text-indigo-600"
                            />

                            <span className="text-sm font-semibold text-slate-700">
                                Choose files to upload
                            </span>

                            <span className="text-xs text-slate-500 text-center">
                                Maximum 5 files, 5 MB each
                            </span>

                            <span className="text-xs text-slate-500 text-center">
                                JPG, PNG, PDF, DOC, DOCX and TXT
                            </span>

                            <input
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                                className="hidden"
                                disabled={loading || ticketCreated}
                                onChange={handleFileChange}
                            />

                        </label>

                        {/* SELECTED FILES */}

                        {selectedFiles.length > 0 && (

                            <div className="mt-3 space-y-2">

                                <p className="text-xs font-semibold text-slate-600">
                                    Selected Files ({selectedFiles.length}/5)
                                </p>

                                {selectedFiles.map((file, index) => (

                                    <div
                                        key={`${file.name}-${index}`}
                                        className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg"
                                    >

                                        <FileText
                                            size={18}
                                            className="text-indigo-600 shrink-0"
                                        />

                                        <div className="flex-1 min-w-0">

                                            <p className="text-sm font-medium text-slate-700 truncate">
                                                {file.name}
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>

                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(index)}
                                            disabled={loading}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                            aria-label={`Remove ${file.name}`}
                                        >
                                            <X size={17} />
                                        </button>

                                    </div>

                                ))}

                            </div>

                        )}

                    </div>

                    {/* UPLOAD PROGRESS */}

                    {uploadingAttachments && (
                        <div className="flex items-center gap-2 text-sm text-indigo-600">
                            <Loader2
                                size={18}
                                className="animate-spin"
                            />
                            Uploading attachments...
                        </div>
                    )}

                    {/* FOOTER */}

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-slate-200">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-5 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition disabled:opacity-50"
                        >
                            {ticketCreated ? "Close" : "Cancel"}
                        </button>

                        {!ticketCreated && (
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
                            >

                                {loading ? (
                                    <>
                                        <Loader2
                                            size={17}
                                            className="animate-spin"
                                        />
                                        {uploadingAttachments
                                            ? "Uploading..."
                                            : "Creating..."}
                                    </>
                                ) : (
                                    <>
                                        <Send size={17} />
                                        Create Ticket
                                    </>
                                )}

                            </button>
                        )}

                    </div>

                </form>

            </div>
        </div>
    );
}

export default CreateTicket;
