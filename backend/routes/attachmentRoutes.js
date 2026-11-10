
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const uploadFiles = require("../middleware/uploadMiddleware");

const {
    uploadAttachments,
    getTicketAttachments,
    downloadAttachment
} = require("../controllers/attachmentController");

// All attachment routes require authentication
router.use(protect);

// Upload attachments to a ticket
router.post(
    "/tickets/:ticketId",
    uploadFiles,
    uploadAttachments
);

// Get all attachments for a ticket
router.get(
    "/tickets/:ticketId",
    getTicketAttachments
);

// Download a specific attachment
router.get(
    "/tickets/:ticketId/:attachmentId/download",
    downloadAttachment
);

module.exports = router;
