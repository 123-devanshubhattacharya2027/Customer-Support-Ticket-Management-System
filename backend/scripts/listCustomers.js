const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

async function listCustomers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const customers = await User.find({ role: "Customer" })
            .select("name email role isActive");

        console.log("\nRegistered Customers:");

        console.table(customers.map(user => ({
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        })));

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

listCustomers();