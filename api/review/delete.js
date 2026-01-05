import crypto from "crypto";
import { connectDB } from "../../lib/db.js";
import Review from "../../lib/review.model.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const { review_id, security_key } = req.body || {};

    if (!review_id || !security_key) {
      return res.status(400).json({ error: "MISSING_FIELDS" });
    }

    await connectDB();

    // -----------------------------
    // ADMIN OVERRIDE DELETE
    // -----------------------------
    if (security_key === process.env.ADMIN_DELETE_CODE) {
      const deleted = await Review.findByIdAndDelete(review_id);

      if (!deleted) {
        return res.status(404).json({ error: "REVIEW_NOT_FOUND" });
      }

      return res.json({
        success: true,
        deleted_review_id: review_id,
        deleted_by: "admin"
      });
    }

    // -----------------------------
    // NORMAL USER DELETE
    // -----------------------------
    const security_hash = crypto
      .createHash("sha256")
      .update(security_key)
      .digest("hex");

    const deleted = await Review.findOneAndDelete({
      _id: review_id,
      security_hash
    });

    if (!deleted) {
      return res.status(401).json({ error: "INVALID_SECURITY_KEY" });
    }

    return res.json({
      success: true,
      deleted_review_id: review_id,
      deleted_by: "user"
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
