const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

async function promoteAgent() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const agent = await User.findOne({
            email: "agent1@supportdesk.com"
        });

        if (!agent) {
            throw new Error("Agent account not found.");
        }

        agent.role = "Agent";
        await agent.save();

        console.log("Account promoted to Agent successfully.");
        console.log("Email:", agent.email);
        console.log("Role:", agent.role);

    } catch (error) {
        console.error("Error:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

promoteAgent();