
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

import connectDB from "./config/db.js";

import collegeRoutes from "./routes/collegeRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Student Marketplace API is running",
  });
});

// Current logged-in user
app.get(
  "/api/auth/me",
  (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  },
  authMiddleware,
  (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        college: req.user.college,
        role: req.user.role,
      },
    });
  }
);

// API routes
app.use("/api/colleges", collegeRoutes);
app.use("/api/auth", authRoutes);

// Server configuration
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
