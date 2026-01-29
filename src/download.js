const express = require("express");
const path = require("path");
const { verifyFirebaseToken } = require('./config/firebase-admin');
const { createDownloadUrl } = require('./services/storage-services');

const router = express.Router();

router.post("/download", async (req, res) => {
  try {
    console.log("📥 Download request received");

    // 1. Verify Firebase token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyFirebaseToken(token);
    const userId = decodedToken.uid;

    console.log(`✅ User authenticated for download: ${userId}`);

    // 2. Get storagePath from request body
    const { storagePath } = req.body;
    if (!storagePath) {
      return res.status(400).json({
        success: false,
        error: "Storage path is required",
      });
    }

    console.log(`Attempting to generate download URL for: ${storagePath}`);

    // 3. Generate signed download URL
    const downloadUrl = await createDownloadUrl(storagePath);

    // 4. Return success response with the download URL
    res.json({
      success: true,
      downloadUrl,
    });

  } catch (error) {
    console.error("🔥 Download error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

module.exports = router;
