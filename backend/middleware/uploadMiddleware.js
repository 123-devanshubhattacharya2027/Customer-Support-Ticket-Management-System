
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDirectory = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const allowedFiles = {
    ".jpg": ["image/jpeg"],
    ".jpeg": ["image/jpeg"],
    ".png": ["image/png"],
    ".pdf": ["application/pdf"],
    ".doc": ["application/msword"],
    ".docx": [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    ".txt": ["text/plain"]
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `${crypto.randomUUID()}${extension}`);
    }
});

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedMimeTypes = allowedFiles[extension];

    if (!allowedMimeTypes || !allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error("Invalid file type."));
    }

    cb(null, true);
};

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5
    },
    fileFilter
});

// Check actual file signatures/content
async function validateFileContent(file) {
    const content = await fs.promises.readFile(file.path);
    const extension = path.extname(file.originalname).toLowerCase();

    const isJpg =
        content.length >= 3 &&
        content[0] === 0xFF &&
        content[1] === 0xD8 &&
        content[2] === 0xFF;

    const isPng =
        content.length >= 8 &&
        content.subarray(0, 8).equals(
            Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
        );

    const isPdf = content.subarray(0, 5).toString() === "%PDF-";

    const isDoc =
        content.length >= 8 &&
        content.subarray(0, 8).equals(
            Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])
        );

    const isDocx =
        content.length >= 4 &&
        content[0] === 0x50 &&
        content[1] === 0x4B &&
        content[2] === 0x03 &&
        content[3] === 0x04;

    let valid = false;

    switch (extension) {
        case ".jpg":
        case ".jpeg":
            valid = isJpg;
            break;

        case ".png":
            valid = isPng;
            break;

        case ".pdf":
            valid = isPdf;
            break;

        case ".doc":
            valid = isDoc;
            break;

        case ".docx":
            valid = isDocx;
            break;

        case ".txt":
            try {
                const text = new TextDecoder("utf-8", { fatal: true });
                text.decode(content);
                valid = !content.includes(0);
            } catch {
                valid = false;
            }
            break;
    }

    return valid;
}

// Run Multer, then validate uploaded file contents
const uploadAttachments = (req, res, next) => {
    upload.array("attachments", 5)(req, res, async (err) => {
        if (err) {
            return next(err);
        }

        try {
            for (const file of req.files || []) {
                const valid = await validateFileContent(file);

                if (!valid) {
                    throw new Error(
                        `File content does not match its extension: ${file.originalname}`
                    );
                }
            }

            next();
        } catch (error) {
            // Remove files if validation fails
            await Promise.all(
                (req.files || []).map(file =>
                    fs.promises.unlink(file.path).catch(() => {})
                )
            );

            next(error);
        }
    });
};

module.exports = uploadAttachments;

























































