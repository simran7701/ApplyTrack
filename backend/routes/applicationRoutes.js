const express = require("express");
const mongoose = require("mongoose");
const Application = require("../models/Application");
const authenticate = require("../middleware/auth");
const requireDatabase = require("../middleware/requireDatabase");

const router = express.Router();
const fields = [
    "companyName",
    "jobRole",
    "location",
    "jobType",
    "applicationDate",
    "status",
    "jobDescription",
    "jobLink",
    "interviewDate",
    "notes"
];

const applicationInput = (body) => {
    const result = {};
    for (const field of fields) {
        if (Object.prototype.hasOwnProperty.call(body, field)) result[field] = body[field];
    }
    return result;
};

const handleDatabaseError = (res, error, action) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: "Database unavailable. Please try again later." });
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({ message: error.message });
    }
    console.error(`${action} failed:`, error.message);
    return res.status(500).json({ message: `Unable to ${action} right now` });
};

router.use(authenticate);
router.use(requireDatabase);

router.get("/", async (req, res) => {
    try {
        const query = { userId: req.user.userId };
        if (req.query.status && req.query.status !== "All") query.status = req.query.status;
        if (req.query.jobType && req.query.jobType !== "All") query.jobType = req.query.jobType;
        if (typeof req.query.search === "string" && req.query.search.trim()) {
            const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            query.$or = [
                { companyName: { $regex: escaped, $options: "i" } },
                { jobRole: { $regex: escaped, $options: "i" } }
            ];
        }
        const sort = req.query.sort === "oldest" ? { applicationDate: 1 } : { applicationDate: -1 };
        const applications = await Application.find(query).sort(sort).lean();
        return res.status(200).json(applications);
    } catch (error) {
        return handleDatabaseError(res, error, "load applications");
    }
});

router.post("/", async (req, res) => {
    try {
        const data = applicationInput(req.body || {});
        const application = await Application.create({ ...data, userId: req.user.userId });
        return res.status(201).json({ message: "Application created", application });
    } catch (error) {
        return handleDatabaseError(res, error, "create application");
    }
});

router.get("/:id", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid application ID" });
    try {
        const application = await Application.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!application) return res.status(404).json({ message: "Application not found" });
        return res.status(200).json({ application });
    } catch (error) {
        return handleDatabaseError(res, error, "load application");
    }
});

router.put("/:id", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid application ID" });
    try {
        const data = applicationInput(req.body || {});
        if (Object.keys(data).length === 0) {
            return res.status(400).json({ message: "Provide at least one application field to update" });
        }
        const application = await Application.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            { $set: data },
            { new: true, runValidators: true }
        );
        if (!application) return res.status(404).json({ message: "Application not found" });
        return res.status(200).json({ message: "Application updated", application });
    } catch (error) {
        return handleDatabaseError(res, error, "update application");
    }
});

router.delete("/:id", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid application ID" });
    try {
        const application = await Application.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
        if (!application) return res.status(404).json({ message: "Application not found" });
        return res.status(200).json({ message: "Application deleted" });
    } catch (error) {
        return handleDatabaseError(res, error, "delete application");
    }
});

module.exports = router;
