const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 120
    },
    jobRole: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 120
    },
    location: { type: String, trim: true, maxlength: 120, default: "" },
    jobType: {
        type: String,
        enum: ["Full-time", "Part-time", "Internship", "Contract", "Other"],
        default: "Full-time"
    },
    applicationDate: { type: Date, required: true, default: Date.now },
    status: {
        type: String,
        enum: ["Applied", "Assessment", "Interview", "Selected", "Rejected"],
        default: "Applied"
    },
    jobDescription: { type: String, trim: true, maxlength: 5000, default: "" },
    jobLink: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: "",
        validate: {
            validator(value) {
                if (!value) return true;
                try {
                    return ["http:", "https:"].includes(new URL(value).protocol);
                } catch {
                    return false;
                }
            },
            message: "Job link must be a valid HTTP or HTTPS URL"
        }
    },
    interviewDate: { type: Date, default: null },
    notes: { type: String, trim: true, maxlength: 5000, default: "" }
}, { timestamps: true });

applicationSchema.index({ userId: 1, applicationDate: -1 });

module.exports = mongoose.model("Application", applicationSchema);
