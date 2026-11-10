const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const interviewRoutes = require("./routes/interviewRoutes");

const app = express();
const configuredOrigins = (process.env.CLIENT_URL || process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => new URL(origin).origin);
const allowedOrigins = configuredOrigins.length > 0
    ? configuredOrigins
    : process.env.NODE_ENV === "production"
        ? []
        : ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true
}));
app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
    res.json({ message: "ApplyTrack API is running" });
});

app.get("/api/health", (req, res) => {
    const connected = mongoose.connection.readyState === 1;
    console.log("MongoDB readyState:", mongoose.connection.readyState);
    res.status(connected ? 200 : 503).json({
        status: connected ? "ok" : "degraded",
        message: connected ? "API and database are available" : "API is running; database is unavailable",
        database: connected ? "connected" : "disconnected"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewRoutes);

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
    console.error("Request error:", error.message);
    if (res.headersSent) return next(error);
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Request body must contain valid JSON" });
    }
    const status = error.message === "Origin is not allowed by CORS" ? 403 : 500;
    return res.status(status).json({ message: status === 403 ? error.message : "An unexpected server error occurred" });
});

const PORT = Number(process.env.PORT) || 5000;
const server = app.listen(PORT, () => {
    console.log(`ApplyTrack API listening on port ${PORT}`);
    connectDB().catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });
});

module.exports = { app, server };
