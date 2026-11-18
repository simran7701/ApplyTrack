const mongoose = require("mongoose");

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) {
        throw new Error("MONGO_URI is not configured");
    }

    let parsedUri;
    try {
        parsedUri = new URL(mongoUri);
    } catch {
        throw new Error("MONGO_URI is not a valid MongoDB connection URL");
    }
    if (!["mongodb:", "mongodb+srv:"].includes(parsedUri.protocol) || !parsedUri.hostname) {
        throw new Error("MONGO_URI must use mongodb:// or mongodb+srv:// with a valid host");
    }
    const authorityStart = mongoUri.indexOf("://") + 3;
    const remainder = mongoUri.slice(authorityStart);
    const authorityEnd = remainder.search(/[/?#]/);
    const authority = authorityEnd === -1 ? remainder : remainder.slice(0, authorityEnd);
    if ((authority.match(/@/g) || []).length > 1) {
        throw new Error("MONGO_URI contains an unescaped @ character; URL-encode reserved characters in the connection string");
    }
    if (parsedUri.hash) {
        throw new Error("MONGO_URI contains an unescaped # character; URL-encode reserved characters in the connection string");
    }

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log("MongoDB connected successfully");
};

module.exports = connectDB;
