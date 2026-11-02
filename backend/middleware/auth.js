const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ message: "Please sign in to continue" });
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not configured");
        return res.status(503).json({ message: "Authentication is not configured on the server" });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { userId: payload.sub };
        return next();
    } catch (error) {
        return res.status(401).json({ message: "Your session is invalid or has expired. Please sign in again." });
    }
};

module.exports = authenticate;
