const { v4: uuidv4 } = require("uuid");
const supabase = require("../config/supabase");

const uploadFile = async (file, userId, projectId) => {
  const safeFileName = file.originalname.replace(/\s+/g, "_");
  const uniqueFileName = `${uuidv4()}_${safeFileName}`;
  const storagePath = `uploads/${userId}/${projectId}/${uniqueFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("website-upload")
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload to storage: ${uploadError.message}`);
  }

  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from("website-upload")
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days

  if (urlError) {
    throw new Error(`Failed to generate upload URL: ${urlError.message}`); // Changed from download to upload for clarity
  }

  return {
    path: storagePath,
    url: signedUrlData.signedUrl,
  };
};

const createDownloadUrl = async (storagePath) => {
  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from("website-upload")
    .createSignedUrl(storagePath, 60 * 60 * 24); // 24 hours validity for download

  if (urlError) {
    throw new Error(`Failed to generate download URL: ${urlError.message}`);
  }

  return signedUrlData.signedUrl;
};

module.exports = {
  uploadFile,
  createDownloadUrl,
};
