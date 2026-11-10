const express = require("express");
const mongoose = require("mongoose");
const Application = require("../models/Application");
const authenticate = require("../middleware/auth");
const requireDatabase = require("../middleware/requireDatabase");

const router = express.Router();

router.use(authenticate);
router.use(requireDatabase);

router.get("/", async (req, res) => {
    try {
        const interviews = await Application.find({
            userId: req.user.userId,
            interviewDate: { $ne: null }
        }).sort({ interviewDate: 1 }).lean();
        return res.status(200).json(interviews);
    } catch (error) {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: "Database unavailable. Please try again later." });
        }
        console.error("Load interviews failed:", error.message);
        return res.status(500).json({ message: "Unable to load interviews right now" });
    }
});

router.get("/:id", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid interview ID" });
    }
    try {
        const interview = await Application.findOne({
            _id: req.params.id,
            userId: req.user.userId,
            interviewDate: { $ne: null }
        }).lean();
        if (!interview) return res.status(404).json({ message: "Interview not found" });
        return res.status(200).json(interview);
    } catch (error) {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ message: "Database unavailable. Please try again later." });
        }
        console.error("Load interview failed:", error.message);
        return res.status(500).json({ message: "Unable to load interview right now" });
    }
});

module.exports = router;
