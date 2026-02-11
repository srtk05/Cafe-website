require('dotenv').config();
const verifyAdmin = require("./middleware/auth");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required. Set it in your .env file.");
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function ensureBootstrapAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log("Bootstrap admin skipped: ADMIN_EMAIL/ADMIN_PASSWORD not set");
    return;
  }

  if (ADMIN_PASSWORD.length < 8) {
    console.warn("Bootstrap admin skipped: ADMIN_PASSWORD must be at least 8 characters");
    return;
  }

  try {
    const existingAdmin = await Admin.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      console.log("Bootstrap admin: existing admin found");
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await Admin.create({ email: ADMIN_EMAIL, password: hashedPassword });
    console.log("Bootstrap admin created successfully");
  } catch (error) {
    console.error("Bootstrap admin error:", error);
  }
}

const app = express();

// Basic security headers
app.use((_, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  next();
});

// Simple rate limiter (per IP): 100 requests / 5 minutes
const rateLimits = new Map();
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 1000;
app.use((req, res, next) => {
  const now = Date.now();
  const key = req.ip || "unknown";
  const entry = rateLimits.get(key) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW_MS) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  rateLimits.set(key, entry);
  if (entry.count > RATE_MAX) {
    return res.status(429).json({ message: "Too many requests. Please try again later." });
  }
  next();
});

// CORS (locked to origin if provided)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
app.use(cors({
  origin: FRONTEND_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "5mb" }));

// Serve frontend files
app.use(express.static(path.join(__dirname, "../client")));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await ensureBootstrapAdmin();
  })
  .catch(err => console.error("MongoDB error:", err));

// Routes
const orderRoutes = require("./routes/orderRoutes");
const menuRoutes = require("./routes/menuRoutes");
const offerRoutes = require("./routes/offerRoutes");
const galleryRoutes = require("./routes/galleryRoutes");

app.use("/api/orders", orderRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/offer", offerRoutes);
app.use("/api/gallery", galleryRoutes);

app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // ✅ CREATE TOKEN
    const token = jwt.sign(
      { id: admin._id },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token: token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/admin", verifyAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "../client/admin.html"));
});

// Default page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
