const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

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
const allowedOrigins = [...new Set([
    ...configuredOrigins,
    ...(process.env.NODE_ENV === "production"
        ? ["https://applytrack-live-2026.vercel.app"]
        : configuredOrigins.length === 0
            ? ["http://localhost:5173", "http://127.0.0.1:5173"]
            : [])
])];

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
const DATABASE_RETRY_DELAY_MS = 10000;

const safeMongoErrorMessage = (error) => {
    const message = error instanceof Error ? error.message : "Unknown database connection error";
    return message.replace(/mongodb(?:\+srv)?:\/\/[^\s"'`]+/gi, "[MongoDB URI redacted]");
};

mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", safeMongoErrorMessage(error));
});
mongoose.connection.on("disconnected", () => {
    console.error("MongoDB disconnected; database requests will remain unavailable until reconnected");
});
mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected successfully");
});

const connectDatabaseWithRetry = async () => {
    try {
        await connectDB();
    } catch (error) {
        console.error("MongoDB connection failed:", safeMongoErrorMessage(error));
        const retry = setTimeout(connectDatabaseWithRetry, DATABASE_RETRY_DELAY_MS);
        retry.unref();
    }
};

const server = app.listen(PORT, () => {
    console.log(`ApplyTrack API listening on port ${PORT}`);
    connectDatabaseWithRetry();
});

module.exports = { app, server };
