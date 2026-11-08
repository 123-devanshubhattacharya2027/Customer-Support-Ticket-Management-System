const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

async function resetAgentPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const agent = await User.findOne({
            email: "agent1@supportdesk.com"
        }).select("+password");

        if (!agent) {
            throw new Error("Agent account not found.");
        }

        agent.password = "Agent#SupportDesk2026!Secure";
        await agent.save();

        console.log("Agent password reset successfully.");
    } catch (error) {
        console.error("Password reset failed:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

resetAgentPassword();