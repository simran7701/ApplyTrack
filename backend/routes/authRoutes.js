const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const authenticate = require("../middleware/auth");
const requireDatabase = require("../middleware/requireDatabase");

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const issueToken = (userId) => jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
);

router.post("/register", async (req, res) => {
    const { name, email, password } = req.body || {};
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
        return res.status(400).json({ message: "Name must be between 2 and 80 characters" });
    }
    if (typeof email !== "string" || !emailPattern.test(email.trim()) || email.length > 254) {
        return res.status(400).json({ message: "Enter a valid email address" });
    }
    if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
        return res.status(400).json({ message: "Password must be at least 8 characters and no more than 72 bytes" });
    }
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not configured");
        return res.status(503).json({ message: "Authentication is not configured on the server" });
    }
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: "Database unavailable. Please try again later." });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();
        if (await User.exists({ email: normalizedEmail })) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({ name: name.trim(), email: normalizedEmail, password: passwordHash });
        const token = issueToken(user._id.toString());
        return res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: "An account with this email already exists" });
        if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: "Database unavailable. Please try again later." });
        console.error("Registration failed:", error.message);
        return res.status(500).json({ message: "Unable to create account right now" });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || !emailPattern.test(email.trim()) || typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
        return res.status(400).json({ message: "Enter a valid email and password" });
    }
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not configured");
        return res.status(503).json({ message: "Authentication is not configured on the server" });
    }
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: "Database unavailable. Please try again later." });
    }

    try {
        const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Email or password is incorrect" });
        }
        const token = issueToken(user._id.toString());
        return res.status(200).json({
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: "Database unavailable. Please try again later." });
        console.error("Login failed:", error.message);
        return res.status(500).json({ message: "Unable to sign in right now" });
    }
});

router.get("/me", authenticate, async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: "Database unavailable. Please try again later." });
    }
    try {
        const user = await User.findById(req.user.userId).select("name email");
        if (!user) return res.status(401).json({ message: "Account not found. Please sign in again." });
        return res.status(200).json({ user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: "Database unavailable. Please try again later." });
        console.error("Loading profile failed:", error.message);
        return res.status(500).json({ message: "Unable to load your profile" });
    }
});

module.exports = router;
