const express = require("express");
const multer = require("multer");

const { verifyFirebaseToken } = require('./config/firebase-admin');
const { uploadFile } = require('./services/storage-services');

const router = express.Router();

// Configure multer for memory storage for videos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Validate file types for videos
    const allowedMimeTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`), false);
    }
  }
});

// Video Upload endpoint
router.post("/upload-video", upload.single("file"), async (req, res) => {
  try {
    console.log("🎬 Video upload request received");
    
    // 1. Verify Firebase token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false, 
        error: "Missing or invalid authorization header" 
      });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyFirebaseToken(token);
    const userId = decodedToken.uid;
    
    console.log(`✅ User authenticated: ${userId}. Decoded Token UID: ${decodedToken.uid}`);

    // 2. Get file and a unique identifier (e.g., gallery item name or timestamp)
    const file = req.file;
    if (!file) {
      console.warn("⚠️ No video file uploaded in request.");
      return res.status(400).json({ 
        success: false, 
        error: "No file uploaded" 
      });
    }
    console.log(`Received video file: ${file.originalname}, MIME: ${file.mimetype}, Size: ${(file.size / 1024).toFixed(2)} KB`);

    const { contextId } = req.body;
    if (!contextId) {
      console.warn("⚠️ Context ID is missing from request body for video upload.");
      return res.status(400).json({ 
        success: false, 
        error: "A context ID (e.g., gallery item name) is required" 
      });
    }
    console.log(`Received contextId: ${contextId}`);

    console.log(`🎥 Processing video: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB) for context: ${contextId}`);

    // 3. Upload to Supabase Storage using the service
    // We can create a more specific path for videos
    const { path, url } = await uploadFile(file, userId, `gallery_videos/${contextId}`);
    console.log(`🚀 Video file uploaded to Supabase. Path: ${path}, URL: ${url}`);

    // 4. Return success response
    const response = {
      success: true,
      path,
      url,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      uploadedAt: new Date().toISOString(),
      userId: userId,
      contextId: contextId
    };

    console.log("📨 Sending success response for video:", JSON.stringify(response, null, 2));
    res.json(response);

  } catch (error) {
    console.error("🔥 Video upload error:", error);
    
    res.status(500).json({ 
      success: false, 
      error: "Internal server error", 
      details: error.message 
    });
  }
});

module.exports = router;
