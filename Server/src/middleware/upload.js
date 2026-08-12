import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

// Memory storage — the file buffer goes straight to Cloudinary via
// uploadToCloudinary.js and is never written to this server's disk.
// This replaces the diskStorage approach from Phase 5 (avatars) and
// Phase 7 (attachments), which didn't survive redeploys on most hosts.
const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new ApiError(400, "Only JPEG, PNG, or WEBP images are allowed"));
  }
  cb(null, true);
};

const imageOrPdfFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new ApiError(400, "Only images or PDF files are allowed"));
  }
  cb(null, true);
};

export const uploadAvatar = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single("avatar");

export const uploadAttachment = multer({
  storage,
  fileFilter: imageOrPdfFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single("attachment");
