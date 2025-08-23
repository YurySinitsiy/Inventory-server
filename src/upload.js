import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "./clodinary.js";

const uploadRoutes = express.Router();
const upload = multer(); // сохраняем файлы в память

uploadRoutes.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "inventory" },
        (error, result) => {
          if (result) resolve(result);
          else reject(error);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default uploadRoutes;
