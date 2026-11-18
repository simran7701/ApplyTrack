const mongoose = require("mongoose");
const connectDB = require("../config/db");

const requireDatabase = async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) await connectDB();
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: "Database unavailable. Please try again later." });
        }
        return next();
    } catch (error) {
        console.error("Database connection required by request failed:", error.name || "Unknown error");
        return res.status(503).json({ message: "Database unavailable. Please try again later." });
    }
};

module.exports = requireDatabase;
