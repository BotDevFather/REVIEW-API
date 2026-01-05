// api/review/submit.js
import multer from "multer";
import crypto from "crypto";
import { connectDB } from "../../lib/db.js";
import Review from "../../lib/review.model.js";
import { uploadToImgBB } from "../../lib/imgbb.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 } // 4MB SAFE
});

export const config = {
  api: { bodyParser: false }
};

export default function handler(req, res) {
  console.log("🔥 FUNCTION HIT");
  console.log("METHOD:", req.method);
  console.log("HEADERS:", req.headers);

  if (req.method !== "POST") {
    console.log("❌ NOT POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  upload.fields([
    { name: "pfp", maxCount: 1 },
    { name: "main_image", maxCount: 1 }
  ])(req, res, async err => {
    if (err) {
      console.error("❌ MULTER ERROR:", err);
      return res.status(400).json({ error: err.message });
    }

    try {
      console.log("✅ MULTER OK");
      console.log("BODY:", req.body);
      console.log("FILES:", Object.keys(req.files || {}));

      if (!req.body.data) {
        console.error("❌ req.body.data missing");
        return res.status(400).json({ error: "DATA_MISSING" });
      }

      let parsed;
      try {
        parsed = JSON.parse(req.body.data);
      } catch (e) {
        console.error("❌ JSON PARSE ERROR", e);
        return res.status(400).json({ error: "INVALID_JSON" });
      }

      console.log("✅ PARSED JSON:", parsed);

      const { user, security_key, message } = parsed;

      if (!user || !security_key || !message) {
        console.error("❌ INVALID PAYLOAD");
        return res.status(400).json({ error: "INVALID_PAYLOAD" });
      }

      if (!req.files?.pfp || !req.files?.main_image) {
        console.error("❌ FILES MISSING");
        return res.status(400).json({ error: "IMAGES_REQUIRED" });
      }

      console.log("📤 UPLOADING IMAGES");

      const pfp = await uploadToImgBB(
        req.files.pfp[0].buffer,
        req.files.pfp[0].originalname
      );

      const main = await uploadToImgBB(
        req.files.main_image[0].buffer,
        req.files.main_image[0].originalname
      );

      console.log("✅ IMAGES UPLOADED");

      const security_hash = crypto
        .createHash("sha256")
        .update(security_key)
        .digest("hex");

      await connectDB();

      const review = await Review.create({
        user,
        message,
        images: { pfp: pfp.url, main: main.url },
        security_hash,
        status: "approved"
      });

      console.log("✅ REVIEW SAVED:", review._id);

      return res.json({ success: true, id: review._id });

    } catch (e) {
      console.error("🔥 UNHANDLED ERROR:", e);
      return res.status(500).json({ error: "SERVER_ERROR", details: e.message });
    }
  });
}
