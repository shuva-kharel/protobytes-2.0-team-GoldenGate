// Load env with expansion support
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
dotenvExpand.expand(dotenv.config());

const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
// REMOVE xss-clean and express-mongo-sanitize for Express 5
// const xssClean = require("xss-clean");               // ⛔ remove
// const mongoSanitize = require("express-mongo-sanitize"); // ⛔ remove
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const kycRoutes = require("./routes/kycRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const borrowRoutes = require("./routes/borrowRoutes");
const productRequestRoutes = require("./routes/productRequestRoutes");
const chatRoutes = require("./routes/chatRoutes");
const { Server } = require("socket.io");
const { registerChatSocket } = require("./sockets/chatSocket");

const deviceMiddleware = require("./middlewares/deviceMiddleware");
const errorHandler = require("./middlewares/errorHandler");
const logger = require("./utils/logger");
const transporter = require("./config/mailer");

const app = express();
const server = http.createServer(app);

// Trust proxy if behind NGINX/Heroku/Render
app.set("trust proxy", 1);

// CORS — be explicit; cookies need credentials: true
app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN || "http://localhost:3000").split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Logging
app.use(morgan("combined"));

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// HPP protection
app.use(hpp());

// Parsers
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

/**
 * Express 5–safe sanitizer
 * Mutates req.body, req.params, req.query IN PLACE (no reassignment) to remove leading $
 * and replace '.' keys to mitigate Mongo operator injection.
 */
function sanitizeKeysInPlace(obj, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 10) return;

  for (const key of Object.keys(obj)) {
    const unsafe = key.startsWith("$") || key.includes(".");
    const safeKey = key.replace(/^\$+/g, "").replace(/\./g, "_");

    if (unsafe) {
      obj[safeKey] = obj[key];
      delete obj[key];
      logger.warn("Sanitized key", { key, safeKey });
    }

    const val = obj[safeKey];
    if (val && typeof val === "object") {
      sanitizeKeysInPlace(val, depth + 1);
    }
  }
}

app.use((req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") sanitizeKeysInPlace(req.body);
    if (req.params && typeof req.params === "object") sanitizeKeysInPlace(req.params);
    if (req.query && typeof req.query === "object") sanitizeKeysInPlace(req.query); // mutate only
    next();
  } catch (e) {
    logger.error("Sanitizer error", { error: e.message });
    next(e);
  }
});

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
app.use("/api/auth", authLimiter);

// DB
connectDB();

// Routes
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/borrow", borrowRoutes);
app.use("/api/product-requests", productRequestRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Server is running 🚀" });
});

// Error handler last
app.use(errorHandler);

// DeviceMiddleware
app.use(deviceMiddleware);


// SMTP verify (optional)
transporter
  .verify()
  .then(() => logger.info("SMTP ready"))
  .catch((err) => logger.error("SMTP error", { error: err.message }));

// Start
const PORT = process.env.PORT || 5000;
const io = new Server(server, {
  cors: {
    origin: (process.env.CLIENT_ORIGIN || "http://localhost:3000").split(","),
    credentials: true,
  },
});
registerChatSocket(io);
app.locals.io = io;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});
