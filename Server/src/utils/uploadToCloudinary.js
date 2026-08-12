import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";

// Multer gives us the file as an in-memory Buffer (see middleware/upload.js —
// memoryStorage, not diskStorage). Cloudinary's SDK wants a stream, so
// streamifier bridges the two. Nothing ever touches this server's disk.
export const uploadBufferToCloudinary = (buffer, { folder, resourceType = "auto" } = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result); // includes secure_url, public_id, resource_type
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Used whenever a file is replaced (new avatar) or removed (attachment
// deleted) — without this, Cloudinary storage fills up with orphaned
// files nobody references anymore.
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    // Never let a cleanup failure break the actual user-facing action.
    console.error(`Failed to delete Cloudinary asset ${publicId}: ${err.message}`);
  }
};
