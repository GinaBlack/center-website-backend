const express = require("express");
const cors = require("cors");
require("dotenv").config();

const uploadRouter = require("./upload.js");
const downloadRouter = require("./download.js"); 
const videoUploadRouter = require("./videoUpload.js");

const app = express();
const PORT = process.env.PORT || 7000;

// Middleware
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api", uploadRouter);
app.use("/api", downloadRouter); // Use download router
app.use("/api", videoUploadRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    service: "Supabase Upload API",
    version: "1.0.0"
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Supabase Upload API",
    endpoints: {
      health: "GET /health",
      upload: "POST /api/upload",
      download: "POST /api/download", // Updated to POST and removed :path
      list: "GET /api/files"
    },
    documentation: "Upload files to Supabase Storage with Firebase Auth"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    requestedUrl: req.url
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📤 Upload: POST http://localhost:${PORT}/api/upload`);
  console.log(`📥 Download: POST http://localhost:${PORT}/api/download`); 
  console.log(`📥 Download: POST http://localhost:${PORT}/api/upload-video`);
  console.log(`📋 List files: GET http://localhost:${PORT}/api/files`);
});