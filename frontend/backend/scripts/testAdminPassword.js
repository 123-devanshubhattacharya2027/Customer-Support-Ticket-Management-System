const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

async function testAdminPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const admin = await User.findOne({
            email: "admin@supportdesk.com"
        }).select("+password");

        if (!admin) {
            console.log("Admin account not found.");
            return;
        }

        console.log("Admin found:", true);
        console.log("Role:", admin.role);
        console.log("Active:", admin.isActive);
        console.log(
            "Password matches:",
            await admin.comparePassword(process.env.ADMIN_RESET_PASSWORD)
        );

    } catch (error) {
        console.error(error.message);
    } finally {
        await mongoose.disconnect();
    }
}

testAdminPassword();