
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected.");

        const admin = await User.findOne({
            email: "admin@supportdesk.com"
        }).select("+password");

        if (!admin) {
            console.log("Admin account NOT FOUND.");
            return;
        }

        console.log("\nAdmin account FOUND!");
        console.log("Name:", admin.name);
        console.log("Email:", admin.email);
        console.log("Role:", admin.role);
        console.log("Active:", admin.isActive);
        console.log("Password hash exists:", Boolean(admin.password));

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkAdmin();

