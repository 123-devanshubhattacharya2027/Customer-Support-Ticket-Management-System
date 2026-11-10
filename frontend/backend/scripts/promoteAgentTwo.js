const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

async function promoteAgentTwo() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const agent = await User.findOne({
            email: "agent2@supportdesk.com"
        });

        if (!agent) {
            throw new Error("Agent Two account not found.");
        }

        agent.role = "Agent";
        agent.password = "AgentTwo#Support2026!Test";

        await agent.save();

        console.log("Agent Two promoted successfully.");
        console.log("Email:", agent.email);
        console.log("Role:", agent.role);
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

promoteAgentTwo();