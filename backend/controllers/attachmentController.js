
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Attachment = require("../models/Attachment");
const Ticket = require("../models/Ticket");

// Remove uploaded files from local storage
const cleanupUploadedFiles = async (files = []) => {
    await Promise.all(
        files.map(file =>
            fs.promises.unlink(file.path).catch(() => {})
        )
    );
};

// Check whether a user can access a ticket
const canAccessTicket = (user, ticket) => {
    if (!user || !ticket) return false;

    if (user.role === "Admin") return true;

    if (user.role === "Agent") {
        return (
            ticket.assignedTo?.toString() === user._id.toString()
        );
    }

    if (user.role === "Customer") {
        return (
            ticket.createdBy?.toString() === user._id.toString()
        );
    }

    return false;
};

// Upload attachments to an existing ticket
const uploadAttachments = async (req, res, next) => {
    const uploadedFiles = req.files || [];

    try {
        const { ticketId } = req.params;

        // Validate ticket ID
        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
            await cleanupUploadedFiles(uploadedFiles);

            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID."
            });
        }

        // Check whether ticket exists
        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            await cleanupUploadedFiles(uploadedFiles);

            return res.status(404).json({
                success: false,
                message: "Ticket not found."
            });
        }

        // Check authorization
        if (!canAccessTicket(req.user, ticket)) {
            await cleanupUploadedFiles(uploadedFiles);

            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this ticket."
            });
        }

        if (uploadedFiles.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please select at least one file."
            });
        }

        // Prepare attachment metadata
        const attachmentRecords = uploadedFiles.map(file => ({
            ticket: ticket._id,
            uploadedBy: req.user._id,
            originalName: file.originalname,
            filename: file.filename,
            mimeType: file.mimetype,
            size: file.size
        }));

        // Save metadata in MongoDB
        const savedAttachments = await Attachment.insertMany(
            attachmentRecords
        );

        return res.status(201).json({
            success: true,
            message: "Attachments uploaded successfully.",
            count: savedAttachments.length,
            attachments: savedAttachments
        });

    } catch (error) {
        // Remove any partially saved metadata
        const filenames = uploadedFiles.map(file => file.filename);

        if (filenames.length > 0) {
            await Attachment.deleteMany({
                filename: { $in: filenames }
            }).catch(() => {});
        }

        // Remove uploaded files if database operation fails
        await cleanupUploadedFiles(uploadedFiles);

        next(error);
    }
};

// Get attachments belonging to a ticket
const getTicketAttachments = async (req, res, next) => {
    try {
        const { ticketId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket ID."
            });
        }

        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found."
            });
        }

        if (!canAccessTicket(req.user, ticket)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this ticket."
            });
        }

        const attachments = await Attachment.find({
            ticket: ticketId
        })
            .populate("uploadedBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: attachments.length,
            attachments
        });

    } catch (error) {
        next(error);
    }
};

// Download an attachment securely
const downloadAttachment = async (req, res, next) => {
    try {
        const { ticketId, attachmentId } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(ticketId) ||
            !mongoose.Types.ObjectId.isValid(attachmentId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid ticket or attachment ID."
            });
        }

        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found."
            });
        }

        if (!canAccessTicket(req.user, ticket)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this ticket."
            });
        }

        // Ensure attachment belongs to the requested ticket
        const attachment = await Attachment.findOne({
            _id: attachmentId,
            ticket: ticketId
        });

        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: "Attachment not found."
            });
        }

        const filePath = path.join(
            __dirname,
            "..",
            "uploads",
            attachment.filename
        );

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "File not found on server."
            });
        }

        return res.download(
            filePath,
            attachment.originalName,
            error => {
                if (error && !res.headersSent) {
                    next(error);
                }
            }
        );

    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadAttachments,
    getTicketAttachments,
    downloadAttachment
};
