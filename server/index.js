
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server dir first, fallback to root
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "../.env") });

import connectDB from "./config/db.js";
import User from "./models/User.js";
import Conversation from "./models/Conversation.js";
import Message from "./models/Message.js";

import collegeRoutes from "./routes/collegeRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import lostFoundRoutes from "./routes/lostFoundRoutes.js";

import authMiddleware from "./middleware/authMiddleware.js";

const app = express();
const httpServer = createServer(app);

// Flexible CORS configuration for local development, Vercel/Netlify, or same-origin
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5000",
];

const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim().replace(/\/+$/, ""))
  : [];

const allowedOrigins = [...new Set([...defaultOrigins, ...configuredOrigins])];

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow mobile apps, curl, or same-origin requests
  const clean = origin.replace(/\/+$/, "");
  return allowedOrigins.includes(clean) || allowedOrigins.includes("*") || process.env.NODE_ENV !== "production";
};

// ============================================
// SOCKET.IO CONFIGURATION
// ============================================

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
    },
    credentials: true,
  },
});

// Make Socket.IO available inside controllers
app.set("io", io);

// ============================================
// SOCKET AUTHENTICATION
// ============================================

io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie || "";

    const tokenCookie = cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("token="));

    if (!tokenCookie) {
      return next(new Error("Authentication required"));
    }

    const token = decodeURIComponent(tokenCookie.substring(6));

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findOne({
      _id: decoded.userId,
      status: "active",
    }).select("_id");

    if (!user) {
      return next(new Error("User not found or inactive"));
    }

    socket.userId = user._id.toString();

    next();

  } catch (error) {
    next(new Error("Invalid or expired authentication token"));
  }
});

// ============================================
// SOCKET CONNECTION
// ============================================

io.on("connection", (socket) => {
  console.log("User connected:", socket.userId);

  // Each user joins their private room
  socket.join(socket.userId);

  // ==========================================
  // MESSAGE DELIVERY ACKNOWLEDGEMENT
  // ==========================================

  socket.on("message-delivered", async (data) => {
    try {
      const { messageId, conversationId } = data || {};

      // Validate IDs
      if (
        !mongoose.Types.ObjectId.isValid(messageId) ||
        !mongoose.Types.ObjectId.isValid(conversationId)
      ) {
        return;
      }

      // Verify that the connected user belongs
      // to this conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        $or: [
          { buyer: socket.userId },
          { seller: socket.userId },
        ],
      });

      if (!conversation) {
        return;
      }

      // Find the message and ensure it belongs
      // to this conversation and was sent by
      // the other participant
      const message = await Message.findOne({
        _id: messageId,
        conversation: conversationId,
        sender: { $ne: socket.userId },
      });

      if (!message) {
        return;
      }

      // Identify original sender
      const senderId = message.sender.toString();

      // Update delivery timestamp only once
      const result = await Message.updateOne(
        {
          _id: messageId,
          conversation: conversationId,
          deliveredAt: null,
        },
        {
          $set: {
            deliveredAt: new Date(),
          },
        }
      );

      // Notify sender only when delivery
      // status was actually updated
      if (result.modifiedCount > 0) {
        const updatedMessage = await Message.findById(
          messageId
        ).select("deliveredAt");

        io.to(senderId).emit("message-delivered", {
          conversationId: conversationId.toString(),
          messageId: messageId.toString(),
          deliveredAt: updatedMessage.deliveredAt,
        });
      }

    } catch (error) {
      console.error("Message delivery error:", error);
    }
  });

  // ==========================================
  // DISCONNECT
  // ==========================================

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId);
  });
});

// ============================================
// EXPRESS MIDDLEWARE
// ============================================

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// ============================================
// HEALTH CHECK
// ============================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Student Marketplace API is running",
  });
});

// ============================================
// CURRENT LOGGED-IN USER
// ============================================

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

// ============================================
// API ROUTES
// ============================================

app.use("/api/colleges", collegeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/lost-found", lostFoundRoutes);

// ============================================
// SERVE PRODUCTION FRONTEND (STATIC ASSETS)
// ============================================

const clientDistPath = path.join(__dirname, "../client/dist");

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // Express 5 wildcard parameter syntax for client-side React Router fallback
  app.get("{*path}", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// ============================================
// SERVER CONFIGURATION
// ============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

  httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  });

  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
