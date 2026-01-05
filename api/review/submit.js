import multer from "multer";
import crypto from "crypto";
import { connectDB } from "../../lib/db.js";
import Review from "../../lib/review.model.js";
import { uploadToImgBB } from "../../lib/imgbb.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

export const config = {
  api: {
    bodyParser: false
  }
};

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  upload.fields([
    { name: "pfp", maxCount: 1 },
    { name: "main_image", maxCount: 1 }
  ])(req, res, async err => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      // ---------- PARSE JSON ----------
      const data = JSON.parse(req.body.data);

      const { user, security_key, message } = data;

      if (!user || !security_key || !message) {
        return res.status(400).json({ error: "INVALID_PAYLOAD" });
      }

      if (!req.files?.pfp || !req.files?.main_image) {
        return res.status(400).json({ error: "IMAGES_REQUIRED" });
      }

      // ---------- UPLOAD IMAGES ----------
      const pfp = await uploadToImgBB(
        req.files.pfp[0].buffer,
        req.files.pfp[0].originalname
      );

      const main = await uploadToImgBB(
        req.files.main_image[0].buffer,
        req.files.main_image[0].originalname
      );

      // ---------- HASH SECURITY KEY ----------
      const security_hash = crypto
        .createHash("sha256")
        .update(security_key)
        .digest("hex");

      // ---------- SAVE TO DB ----------
      await connectDB();

      const review = await Review.create({
        user,
        message,
        images: {
          pfp: pfp.url,
          main: main.url
        },
        security_hash
      });

      return res.json({
        success: true,
        review_id: review._id
      });

    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
}
