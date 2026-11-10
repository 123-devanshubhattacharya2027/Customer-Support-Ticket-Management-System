const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

async function getAgentId() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const agent = await User.findOne({
            email: "agent1@supportdesk.com"
        }).select("_id name email role");

        if (!agent) {
            console.log("Agent not found.");
            return;
        }

        console.log("\nAgent Details:");
        console.log("Name:", agent.name);
        console.log("Email:", agent.email);
        console.log("Role:", agent.role);
        console.log("Agent ID:", agent._id.toString());

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

getAgentId();