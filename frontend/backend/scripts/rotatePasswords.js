
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const accounts = [
    {
        email: "admin@supportdesk.com",
        envKey: "ADMIN_PASSWORD"
    },
    {
        email: "agent1@supportdesk.com",
        envKey: "AGENT1_PASSWORD"
    },
    {
        email: "agent2@supportdesk.com",
        envKey: "AGENT2_PASSWORD"
    },
    {
        email: "rahul@example.com",
        envKey: "CUSTOMER_PASSWORD"
    }
];

async function rotatePasswords() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing from .env");
        }

        // Validate all passwords before changing any account.
        for (const account of accounts) {
            const password = process.env[account.envKey];

            if (!password || password.length < 12) {
                throw new Error(
                    `Missing or weak password for ${account.email}`
                );
            }
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected.");

        for (const account of accounts) {
            const user = await User.findOne({
                email: account.email
            });

            if (!user) {
                throw new Error(`Account not found: ${account.email}`);
            }

            user.password = process.env[account.envKey];

            // Mongoose pre-save hook hashes the password.
            await user.save();

            // Verify using the model's password comparison method.
            const verified = await user.comparePassword(
                process.env[account.envKey]
            );

            if (!verified) {
                throw new Error(
                    `Password verification failed: ${account.email}`
                );
            }

            console.log(`Password updated and verified: ${account.email}`);
        }

        console.log("\nAll four account passwords updated successfully.");

    } catch (error) {
        console.error("\nPassword rotation error:", error.message);
        process.exitCode = 1;

    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

rotatePasswords();
