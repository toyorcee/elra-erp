import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import path from "path";
import { createServer } from "http";
import { EventEmitter } from "events";
import chalk from "chalk";
import xss from "xss-clean";
import { Server as SocketIOServer } from "socket.io";
import Message from "./models/Message.js";
import User from "./models/User.js";
import { initializeNotificationService } from "./controllers/notificationController.js";
import platformAdminRoutes from "./routes/platformAdmin.js";
import industryInstanceRoutes from "./routes/industryInstances.js";
import approvalLevelRoutes from "./routes/approvalLevels.js";
import workflowTemplateRoutes from "./routes/workflowTemplates.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import documentRoutes from "./routes/documents.js";
import dashboardRoutes from "./routes/dashboard.js";
import messageRoutes from "./routes/messages.js";
import notificationRoutes, {
  initializeNotificationRoutes,
} from "./routes/notifications.js";
import departmentRoutes from "./routes/departments.js";
import roleRoutes from "./routes/roles.js";
import systemSettingsRoutes from "./routes/systemSettings.js";
import profileRoutes from "./routes/profile.js";
import auditRoutes from "./routes/audit.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import transactionRoutes from "./routes/transactions.js";
import invitationRoutes from "./routes/invitations.js";
import userRegistrationRoutes from "./routes/userRegistration.js";
import systemSetupRoutes from "./routes/systemSetup.js";
import scanningRoutes from "./routes/scanning.js";
import salaryGradeRoutes from "./routes/salaryGrades.js";

const isValidObjectId = (id) => {
  return (
    id &&
    id !== "undefined" &&
    id !== "null" &&
    mongoose.Types.ObjectId.isValid(id)
  );
};

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

const app = express();
const httpServer = createServer(app);

console.log("[server.js] Environment:", process.env.NODE_ENV);

app.use(cookieParser());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL
        : ["http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400,
  })
);
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
    limit: "50mb",
  })
);
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(helmet());
app.use(mongoSanitize());
app.use(hpp());
app.use(compression());
app.use(xss());

// Security headers
app.use((req, res, next) => {
  // Content Security Policy - Updated for local file storage with Multer
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "img-src 'self' data: blob: https: http:; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "connect-src 'self' wss: ws:; " +
      "media-src 'self' blob:;"
  );

  // Force HTTPS in production
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  // Other security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  // Add CORS headers for preflight requests
  if (req.method === "OPTIONS") {
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    res.setHeader("Access-Control-Max-Age", "86400");
    return res.status(204).end();
  }

  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

EventEmitter.defaultMaxListeners = 15;

// Connect MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });

    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on("error", (error) => {
      console.error("🔴 MongoDB Error:", error.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("🔴 MongoDB Disconnected - Retrying...");
      setTimeout(connectDB, 10000);
    });
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.log("🔄 Reconnecting in 10 seconds...");
    setTimeout(connectDB, 10000);
  }
};

connectDB();

app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/system-settings", systemSettingsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/platform", platformAdminRoutes);
app.use("/api/industry-instances", industryInstanceRoutes);
app.use("/api/approval-levels", approvalLevelRoutes);
app.use("/api/workflow-templates", workflowTemplateRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/user-registration", userRegistrationRoutes);
app.use("/api/system-setup", systemSetupRoutes);
app.use("/api/scanning", scanningRoutes);
app.use("/api/salary-grades", salaryGradeRoutes);

// Create Socket.IO server before starting HTTP server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL
        : ["http://localhost:5173"],
    credentials: true,
  },
});

// Initialize notification routes with io instance
console.log("🔧 Initializing notification routes...");
initializeNotificationRoutes(io);
console.log("✅ Notification routes initialized");

// Make io instance globally available
global.io = io;

// Initialize notification service with io instance
console.log("🔧 Initializing notification service...");
initializeNotificationService(io);
console.log("✅ Notification service initialized");

// Add notification routes after initialization
console.log("🔧 Adding notification routes to Express app...");
app.use("/api/notifications", notificationRoutes);
console.log("✅ Notification routes added to Express app");

// Add a simple test route to verify routing is working
app.get("/api/test-routing", (req, res) => {
  res.json({
    success: true,
    message: "Basic routing is working",
    timestamp: new Date().toISOString(),
  });
});

// Test cookie endpoint
app.get("/api/test-cookies", (req, res) => {
  console.log("🍪 Test cookies endpoint - received cookies:", req.cookies);

  // Set a test cookie
  res.cookie("testCookie", "testValue", {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
    path: "/",
    maxAge: 60000,
  });

  res.json({
    success: true,
    message: "Test cookie set",
    receivedCookies: req.cookies,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api", (req, res) => {
  res.json({
    message: "Welcome to EDMS API",
    version: "1.0.0",
    status: "active",
    environment: process.env.NODE_ENV || "development",
  });
});

// 🔥 Production: Serve Vite frontend
if (isProduction) {
  const clientBuildPath = path.join(__dirname, "../client/dist");

  console.log("💡 App running from:", __dirname);
  console.log("📍 FINAL CLIENT PATH:", clientBuildPath);
  console.log("📂 Directory exists?", existsSync(clientBuildPath));

  if (!existsSync(clientBuildPath)) {
    console.error("❌ MISSING CLIENT FILES! Expected at:", clientBuildPath);
    process.exit(1);
  }

  app.use(express.static(clientBuildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
} else {
  app.get("/dashboard/*", (req, res) => {
    res.redirect(`http://localhost:5173${req.url}`);
  });

  app.get("/", (req, res) => {
    res.redirect("http://localhost:5173");
  });
}

app.use((err, req, res, next) => {
  console.error(chalk.red(err.stack));
  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === "development" ? err.message : "Server Error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

// Start the HTTP server
httpServer.listen(PORT, () => {
  console.log(
    chalk.green.bold(
      `\n${
        isProduction ? "🚀 Production" : "🔧 Development"
      } Server running on port ${chalk.cyan(PORT)}\n`
    )
  );
  console.log(chalk.blue(`📡 API URL: http://localhost:${PORT}/api`));
  console.log(
    chalk.blue(
      `🌐 Client URL: ${process.env.CLIENT_URL || "http://localhost:5173"}`
    )
  );
});

const onlineUsers = new Map();

io.on("connection", async (socket) => {
  const userId = socket.handshake.query.userId;

  // Validate userId before using it
  if (isValidObjectId(userId)) {
    onlineUsers.set(userId, socket.id);

    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      });

      // Emit user online status to all other users
      socket.broadcast.emit("userOnline", { userId });
    } catch (error) {
      console.error("Error updating user online status:", error);
    }

    // Register for notification service
    if (typeof global.notificationService !== "undefined") {
      global.notificationService.registerUser(userId, socket.id);
    }
  }

  // Handle chat message
  socket.on("sendMessage", async (data) => {
    try {
      const { sender, recipient, content, document } = data;

      // Validate required fields
      if (!sender || !recipient || !content) {
        socket.emit("error", {
          message: "Sender, recipient, and content are required",
        });
        return;
      }

      // Validate that sender matches the authenticated user
      if (sender !== userId) {
        socket.emit("error", { message: "Unauthorized: sender mismatch" });
        return;
      }

      // Check if recipient exists
      const recipientUser = await User.findById(recipient);
      if (!recipientUser) {
        socket.emit("error", { message: "Recipient not found" });
        return;
      }

      const message = new Message({ sender, recipient, content, document });
      await message.save();

      await message.populate("sender", "name email avatar firstName lastName");
      await message.populate(
        "recipient",
        "name email avatar firstName lastName"
      );
      if (document) {
        await message.populate("document", "title reference");
      }

      // Create notification for recipient
      if (typeof global.notificationService !== "undefined") {
        await global.notificationService.createNotification({
          recipient: recipient,
          type: "MESSAGE_RECEIVED",
          title: `New message from ${
            message.sender.name || message.sender.firstName
          }`,
          message:
            content.length > 50 ? `${content.substring(0, 50)}...` : content,
          data: {
            senderId: sender,
            messageId: message._id,
            actionUrl: `/messages?conversation=${sender}`,
            priority: "medium",
          },
        });
      }

      // Emit to recipient if online
      const recipientSocketId = onlineUsers.get(recipient);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receiveMessage", {
          _id: message._id,
          sender: message.sender,
          recipient: message.recipient,
          content: message.content,
          document: message.document,
          createdAt: message.createdAt,
          isRead: false,
        });
      }

      // Emit to sender for confirmation
      socket.emit("messageSent", {
        _id: message._id,
        sender: message.sender,
        recipient: message.recipient,
        content: message.content,
        document: message.document,
        createdAt: message.createdAt,
        isRead: false,
      });
    } catch (err) {
      console.error("Send message error:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Mark message as read
  socket.on("markMessageRead", async ({ messageId, userId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message && message.recipient.toString() === userId) {
        message.isRead = true;
        message.readAt = new Date();
        await message.save();

        // Emit read status to sender if online
        const senderSocketId = onlineUsers.get(message.sender.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("messagesRead", {
            readerId: userId,
            messageId: messageId,
          });
        }
      }
    } catch (err) {
      console.error("Mark message read error:", err);
    }
  });

  // Handle typing status
  socket.on("typing", async ({ recipientId, isTyping }) => {
    try {
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("userTyping", {
          userId: userId,
          isTyping,
        });
      }
    } catch (err) {
      console.error("Typing status error:", err);
    }
  });

  // Handle message deletion
  socket.on("deleteMessage", async ({ messageId, userId }) => {
    try {
      const message = await Message.findOne({
        _id: messageId,
        sender: userId,
        isActive: true,
      });

      if (message) {
        message.isActive = false;
        await message.save();

        // Emit message deletion to recipient if online
        const recipientSocketId = onlineUsers.get(message.recipient.toString());
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("messageDeleted", {
            messageId: messageId,
            deletedBy: userId,
          });
        }
      }
    } catch (err) {
      console.error("Delete message error:", err);
    }
  });

  socket.on("disconnect", async () => {
    if (isValidObjectId(userId)) {
      onlineUsers.delete(userId);

      // Update user's offline status
      try {
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        // Emit user offline status to all other users
        socket.broadcast.emit("userOffline", { userId });
      } catch (error) {
        console.error("Error updating user offline status:", error);
      }

      if (typeof global.notificationService !== "undefined") {
        global.notificationService.removeUser(socket.id);
      }
    }
  });
});

export { io, onlineUsers };
