const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Activity = require("../models/Activity");

dotenv.config();

const ticketId = "6ae47b97f67a74f4a256545a";

async function checkActivities() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const activities = await Activity.find({
            ticket: ticketId
        }).sort({ createdAt: 1 });

        console.log("\nTicket Activity History:");

        if (activities.length === 0) {
            console.log("No activity records found.");
        } else {
            console.table(
                activities.map(activity => ({
                    action: activity.action,
                    oldValue: activity.oldValue,
                    newValue: activity.newValue,
                    author: activity.author,
                    date: activity.createdAt
                }))
            );
        }
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkActivities();