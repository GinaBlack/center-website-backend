const express = require("express");
const multer = require("multer");
const path = require("path"); // Added path module
console.log('upload.js __dirname:', __dirname);

const { verifyFirebaseToken } = require('./config/firebase-admin');
const { uploadFile } = require('./services/storage-services');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Validate file types
    const allowedTypes = ['.stl', '.obj', '.3mf', '.step', '.stp'];
    const fileExtension = file.originalname.toLowerCase().slice(
      file.originalname.lastIndexOf('.')
    );
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`), false);
    }
  }
});

// Upload endpoint
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("📤 Upload request received");
    
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
    
    console.log(`✅ User authenticated: ${userId}`);

    // 2. Get file and project ID
    const file = req.file;
    if (!file) {
      return res.status(400).json({ 
        success: false, 
        error: "No file uploaded" 
      });
    }

    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        error: "Project ID is required" 
      });
    }

    console.log(`📁 Processing file: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB) for project: ${projectId}`);

    // 3. Upload to Supabase Storage using the service
    const { path, url } = await uploadFile(file, userId, projectId);

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
      projectId: projectId
    };

    console.log("📨 Sending success response");
    res.json(response);

  } catch (error) {
    console.error("🔥 Upload error:", error);
    
    res.status(500).json({ 
      success: false, 
      error: "Internal server error", 
      details: error.message 
    });
  }
});

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ 
    message: "Upload API is working!",
    timestamp: new Date().toISOString(),
    endpoints: {
      upload: "POST /api/upload",
      test: "GET /api/test"
    }
  });
});

module.exports = router;