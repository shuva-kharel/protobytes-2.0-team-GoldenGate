// Load env with expansion support
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
dotenvExpand.expand(dotenv.config());

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

// CORS (allow cookies)
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// JSON + Cookies
app.use(express.json());
app.use(cookieParser());

// DB
connectDB();

// ROUTES
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Server is running 🚀" });
});

// GLOBAL ERROR HANDLER (must be after routes)
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

// SMTP CHECK
const transporter = require("./config/mailer");
transporter
  .verify()
  .then(() => console.log("SMTP ready"))
  .catch((err) => console.error("SMTP error:", err.message));

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});