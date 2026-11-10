const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;

        

        await mongoose.connect(mongoURI);

        console.log("MongoDB Connected Successfully");
        console.log("Database:", mongoose.connection.name);

    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
        throw error;
    }
};

module.exports = connectDB;