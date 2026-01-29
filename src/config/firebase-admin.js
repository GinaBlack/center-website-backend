const admin = require("firebase-admin");
require("dotenv").config();
console.log('firebase-admin.js __dirname:', __dirname);

try {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.");
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized successfully");

} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin:", error.message);
  console.log("Ensure FIREBASE_SERVICE_ACCOUNT_KEY is set in .env with a valid JSON string.");
  process.exit(1);
}

const verifyFirebaseToken = async (token) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Firebase token verification failed:", error.message);
    throw new Error("Invalid or expired token");
  }
};

module.exports = { verifyFirebaseToken };