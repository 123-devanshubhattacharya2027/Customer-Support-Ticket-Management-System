const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

async function resetAdminPassword() {
    try {
        const email = "admin@supportdesk.com";
        const newPassword = process.env.ADMIN_RESET_PASSWORD;

        if (!newPassword || newPassword.length < 12) {
            throw new Error("ADMIN_RESET_PASSWORD must contain at least 12 characters.");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected.");

        const admin = await User.findOne({ email });

        if (!admin || admin.role !== "Admin") {
            throw new Error("Admin account not found.");
        }

        // User.js automatically hashes this password before saving.
        admin.password = newPassword;
        await admin.save();

        console.log("Admin password reset successfully.");
    } catch (error) {
        console.error("Password reset failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

resetAdminPassword();