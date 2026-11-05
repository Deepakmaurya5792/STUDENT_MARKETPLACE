
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";

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

import authMiddleware from "./middleware/authMiddleware.js";

const app = express();
const httpServer = createServer(app);

// ============================================
// SOCKET.IO CONFIGURATION
// ============================================

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
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
    origin: "http://localhost:5173",
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

// ============================================
// SERVER CONFIGURATION
// ============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
