const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

async function resetCustomerPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const customer = await User.findOne({
            email: "rahul@example.com"
        });

        if (!customer) {
            throw new Error("Customer account not found.");
        }

        customer.password = "Customer#Support2026!Test";
        await customer.save();

        console.log("Customer password reset successfully.");
        console.log("Email:", customer.email);
        console.log("Role:", customer.role);
    } catch (error) {
        console.error("Password reset failed:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

resetCustomerPassword();